package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoImportServiceTest {

    @TempDir
    Path storeDirectory;

    @Mock
    VideoRepository videoRepository;

    @Mock
    UserAccountRepository userAccountRepository;

    @Mock
    VideoService videoService;

    @Mock
    PasswordEncoder passwordEncoder;

    VideoImportService videoImportService;

    @BeforeEach
    void setUp() {
        videoImportService = new VideoImportService(
                videoRepository,
                userAccountRepository,
                videoService,
                passwordEncoder,
                new ObjectMapper()
        );
    }

    @Test
    void importsCompleteVideoMetadataFromStore() throws Exception {
        Files.writeString(storeDirectory.resolve("1.json"), """
                {"title":"Imported title","duration":42.5,"meta":{"description":"Imported description"}}
                """);
        Files.writeString(storeDirectory.resolve("1.mp4"), "");
        Files.writeString(storeDirectory.resolve("1.webp"), "");
        UserAccount owner = new UserAccount("imported@protube.local", "imported-videos", "Imported", "Videos", "hash");
        ReflectionTestUtils.setField(owner, "id", 7L);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.of(owner));
        when(videoRepository.existsByMediaPath("1.mp4")).thenReturn(false);

        videoImportService.importFromStore(storeDirectory);

        ArgumentCaptor<CreateVideoRequest> request = ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(videoService).createVideo(request.capture());
        assertEquals("Imported title", request.getValue().title());
        assertEquals("Imported description", request.getValue().description());
        assertEquals("1.mp4", request.getValue().mediaPath());
        assertEquals("1.webp", request.getValue().thumbnailPath());
        assertEquals(42.5, request.getValue().durationSeconds());
        assertEquals(7L, request.getValue().ownerUserId());
    }

    @Test
    void createsImportUserWhenItDoesNotExist() throws Exception {
        Files.writeString(storeDirectory.resolve("2.json"), "{\"title\":\"Second\"}");
        Files.writeString(storeDirectory.resolve("2.mp4"), "");
        Files.writeString(storeDirectory.resolve("2.webp"), "");
        UserAccount savedOwner = new UserAccount("imported@protube.local", "imported-videos", "Imported", "Videos", "hash");
        ReflectionTestUtils.setField(savedOwner, "id", 8L);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("imported-videos")).thenReturn("hash");
        when(userAccountRepository.save(any(UserAccount.class))).thenReturn(savedOwner);

        videoImportService.importFromStore(storeDirectory);

        verify(userAccountRepository).save(any(UserAccount.class));
        verify(videoService).createVideo(any(CreateVideoRequest.class));
    }

    @Test
    void skipsMissingStoreDirectory() {
        videoImportService.importFromStore(storeDirectory.resolve("missing"));

        verify(videoService, never()).createVideo(any());
    }

    @Test
    void skipsIncompleteVideoFiles() throws Exception {
        Files.writeString(storeDirectory.resolve("3.json"), "{\"title\":\"Incomplete\"}");
        UserAccount owner = new UserAccount("imported@protube.local", "imported-videos", "Imported", "Videos", "hash");
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.of(owner));

        videoImportService.importFromStore(storeDirectory);

        verify(videoService, never()).createVideo(any());
    }
}
