package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.model.*;
import com.tecnocampus.LS2.protube_back.repositories.*;
import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import java.io.IOException;
import java.nio.file.Path;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoUploadServiceTest {
    @Mock MediaStorageService storage;
    @Mock MediaFileValidator validator;
    @Mock VideoRepository videos;
    @Mock UserAccountRepository users;
    @Mock TagRepository tags;
    @Mock VideoService details;
    @Mock PlatformTransactionManager transactions;
    VideoUploadService service;
    UUID id = UUID.randomUUID();
    UploadVideoRequest request = new UploadVideoRequest(" Title ", " desc ", "Music", List.of());
    VideoDetail detail = new VideoDetail(1L, "Title", "owner", "desc", 2, null, "/media/video", List.of(), 0, 0, 0, 0, "Music", "UPLOAD");

    @BeforeEach void setup() {
        service = new VideoUploadService(storage, validator, videos, users, tags, details, transactions);
    }

    void stage() throws Exception {
        when(users.existsById(3L)).thenReturn(true);
        when(storage.begin()).thenReturn(id);
        when(storage.write(eq(id), any(), eq(false))).thenReturn(Path.of("staged"));
        when(validator.videoDuration(any())).thenReturn(2.0);
        when(storage.mediaPath(id)).thenReturn("uploads/" + id + "/video.mp4");
    }

    void transaction() {
        when(transactions.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        when(users.findById(3L)).thenReturn(Optional.of(new UserAccount("owner@example.test", "owner", "First", "Last", "hash")));
        when(videos.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(details.getVideo(null)).thenReturn(Optional.of(detail));
    }

    @Test void commitsBeforeSuccessAndUsesSessionOwnerTrimmedMetadataAndUploadSource() throws Exception {
        stage(); transaction();
        assertEquals(detail, service.upload(request, UploadFixtures.video(), null, 3L));
        var entity = org.mockito.ArgumentCaptor.forClass(Video.class);
        verify(videos).saveAndFlush(entity.capture());
        assertEquals("owner", entity.getValue().getOwner().getAccountName());
        assertEquals("Title", entity.getValue().getTitle());
        assertEquals("desc", entity.getValue().getDescription());
        assertEquals("UPLOAD", entity.getValue().getSource());
        var ordered = inOrder(storage, transactions);
        ordered.verify(storage).publish(id);
        ordered.verify(transactions).commit(any());
        ordered.verify(storage).finish(id);
    }

    @Test void validatesThumbnailAndNormalizesExistingTags() throws Exception {
        stage(); transaction();
        var thumbnail = UploadFixtures.image("png");
        when(storage.write(id, thumbnail, true)).thenReturn(Path.of("thumb"));
        when(validator.imageExtension(any())).thenReturn("png");
        when(tags.findByNameIgnoreCase("rock")).thenReturn(Optional.of(new com.tecnocampus.LS2.protube_back.entities.Tag("rock")));
        service.upload(new UploadVideoRequest("Title", null, "Music", List.of(" Rock ", "rock")), UploadFixtures.video(), thumbnail, 3L);
        verify(storage).nameThumbnail(id, "png");
        verify(storage).thumbnailPath(id, "png");
    }

    @Test void rejectsInvalidTitleCategoryTagsOwnerAndUnknownTagsBeforeStaging() throws Exception {
        assertThrows(UploadException.class, () -> service.upload(new UploadVideoRequest(" ", "", "Music", List.of()), UploadFixtures.video(), null, 3L));
        assertThrows(UploadException.class, () -> service.upload(new UploadVideoRequest("Title", "", "Unknown", List.of()), UploadFixtures.video(), null, 3L));
        assertThrows(InvalidTagsException.class, () -> service.upload(new UploadVideoRequest("Title", "", "Music", List.of("")), UploadFixtures.video(), null, 3L));
        assertThrows(ResourceNotFoundException.class, () -> service.upload(request, UploadFixtures.video(), null, 3L));
        when(users.existsById(3L)).thenReturn(true);
        assertThrows(InvalidTagsException.class, () -> service.upload(new UploadVideoRequest("Title", "", "Music", List.of("unknown")), UploadFixtures.video(), null, 3L));
        verifyNoInteractions(storage, videos);
    }

    @Test void compensatesValidationWriteAndCommitFailuresAndRetainsManifestWhenDatabaseIsUnavailable() throws Exception {
        stage();
        when(validator.videoDuration(any())).thenThrow(new UploadException(415, "corrupt"));
        assertEquals(415, assertThrows(UploadException.class, () -> service.upload(request, UploadFixtures.video(), null, 3L)).getStatus());
        verify(storage).discard(id);
        when(videos.existsByMediaPath(any())).thenThrow(new DataAccessResourceFailureException("offline"));
        assertThrows(UploadException.class, () -> service.upload(request, UploadFixtures.video(), null, 3L));
        verify(storage, times(1)).discard(id);
    }

    @Test void rollsBackFailedCommitAndRecoversPublishedFiles() throws Exception {
        stage(); transaction();
        doThrow(new DataAccessResourceFailureException("commit failed")).when(transactions).commit(any());
        assertEquals(503, assertThrows(UploadException.class, () -> service.upload(request, UploadFixtures.video(), null, 3L)).getStatus());
        verify(storage).discard(id);
    }

    @Test void leavesCommittedMediaWhenManifestCleanupFailsAndRecoversBothCrashStates() throws Exception {
        stage(); transaction();
        doThrow(new IOException("disk unavailable")).when(storage).finish(id);
        assertEquals(detail, service.upload(request, UploadFixtures.video(), null, 3L));
        verify(storage, never()).discard(any());
        doNothing().when(storage).finish(id);
        when(storage.pendingIds()).thenReturn(List.of(id));
        when(videos.existsByMediaPath(any())).thenReturn(true, false);
        service.run(null);
        service.run(null);
        verify(storage).discard(id);
    }

    @Test void registersOnlyExistingUnmanagedFilesAndOverridesCallerOwner() throws Exception {
        Path path = Path.of("existing");
        when(storage.existingFile("sample.mp4")).thenReturn(path);
        when(details.createVideo(any())).thenReturn(detail);
        service.registerExisting(new CreateVideoRequest("Title", "", "sample.mp4", null, 2, 999L, List.of()), 3L);
        verify(validator).videoDuration(path);
        var request = org.mockito.ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(details).createVideo(request.capture());
        assertEquals(3L, request.getValue().ownerUserId());
        when(storage.existingFile("sample.mp4")).thenThrow(new IOException("offline"));
        assertEquals(503, assertThrows(UploadException.class, () -> service.registerExisting(request.getValue(), 3L)).getStatus());
    }
}
