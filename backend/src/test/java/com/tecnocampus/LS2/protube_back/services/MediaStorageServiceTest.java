package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockMultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MediaStorageServiceTest {
    @TempDir Path store;
    MediaStorageService storage() { return new MediaStorageService(new MockEnvironment().withProperty("pro_tube.store.dir", store.toString())); }

    @Test void publishesGeneratedNamesAndKeepsOriginalsWhenRecoveringAnUpload() throws Exception {
        var storage = storage();
        Path original = Files.writeString(store.resolve("original.mp4"), "keep");
        UUID id = storage.begin();
        assertEquals(List.of(id), storage.pendingIds());
        assertEquals("uploads/" + id + "/video.mp4", storage.mediaPath(id));
        storage.write(id, UploadFixtures.video(), false);
        storage.write(id, UploadFixtures.image("png"), true);
        storage.nameThumbnail(id, "png");
        storage.publish(id);
        Path video = store.resolve(storage.mediaPath(id));
        assertArrayEquals(UploadFixtures.mp4(), Files.readAllBytes(video));
        assertTrue(Files.exists(store.resolve(storage.thumbnailPath(id, "png"))));
        assertNull(storage.thumbnailPath(id, null));
        storage.finish(id);
        assertTrue(storage.pendingIds().isEmpty());
        assertTrue(Files.exists(video));
        UUID failed = storage.begin();
        storage.write(failed, UploadFixtures.video(), false);
        storage.publish(failed);
        storage.discard(failed);
        assertFalse(Files.exists(store.resolve(storage.mediaPath(failed))));
        assertEquals("keep", Files.readString(original));
    }

    @Test void rejectsTraversalManagedRegistrationAndInvalidOrMissingFiles() throws Exception {
        var storage = storage();
        for (String path : new String[]{"../escape", "..\\escape", "/escape.mp4", "uploads/some/video.mp4", "missing.mp4", ""}) {
            assertThrows(Exception.class, () -> storage.existingFile(path));
        }
        Files.writeString(store.resolve("exists.mp4"), "exists");
        assertEquals(store.resolve("exists.mp4"), storage.existingFile("exists.mp4"));
        assertThrows(IOException.class, () -> new MediaStorageService(new MockEnvironment()).begin());
        assertTrue(new MediaStorageService(new MockEnvironment()).pendingIds().isEmpty());
        Files.writeString(store.resolve("uploads"), "cannot write a directory here");
        assertThrows(IOException.class, storage::begin);
    }

    @Test void leavesARecoverableManifestAfterTruncatedTransferAndRejectsInvalidImageExtension() throws Exception {
        var storage = storage();
        UUID id = storage.begin();
        var partial = spy(UploadFixtures.video());
        when(partial.getSize()).thenReturn(999L);
        assertEquals(400, assertThrows(UploadException.class, () -> storage.write(id, partial, false)).getStatus());
        assertThrows(IllegalArgumentException.class, () -> storage.nameThumbnail(id, "../bad"));
        storage.discard(id);
        assertTrue(storage.pendingIds().isEmpty());
    }

    @Test void avatarsUseGeneratedNamesAndOnlyGeneratedAvatarFilesCanBeDeleted() throws Exception {
        var storage = storage();
        Path keep = Files.writeString(store.resolve("original.mp4"), "keep");
        Path staged = storage.stageAvatar(UploadFixtures.image("png"));
        assertTrue(staged.startsWith(store.toRealPath().resolve("uploads/.pending")));
        assertThrows(IllegalArgumentException.class, () -> storage.publishAvatar(staged, "../bad"));
        String published = storage.publishAvatar(staged, "png");
        assertTrue(published.matches("uploads/avatars/[0-9a-f-]{36}\\.png"));
        assertFalse(Files.exists(staged));
        assertTrue(storage.pendingIds().isEmpty());

        for (String path : new String[]{"original.mp4", "../original.mp4", "uploads/avatars/../../original.mp4", ""}) {
            storage.deleteAvatar(path);
        }
        storage.deleteAvatar(null);
        assertEquals("keep", Files.readString(keep));
        storage.deleteAvatar(published);
        assertFalse(Files.exists(store.resolve(published)));

        assertEquals(400, assertThrows(UploadException.class,
                () -> storage.stageAvatar(new MockMultipartFile("avatar", new byte[0]))).getStatus());
        assertEquals(413, assertThrows(UploadException.class, () -> storage.stageAvatar(
                new MockMultipartFile("avatar", new byte[(int) MediaFileValidator.AVATAR_LIMIT + 1]))).getStatus());
        Path discarded = storage.stageAvatar(UploadFixtures.image("jpg"));
        storage.discardStagedAvatar(discarded);
        try (var pending = Files.list(store.resolve("uploads/.pending"))) {
            assertEquals(0, pending.count());
        }
    }

    @Test void thumbnailsUseGeneratedNamesAndOnlyGeneratedThumbnailFilesCanBeDeleted() throws Exception {
        var storage = storage();
        Path keep = Files.writeString(store.resolve("original.mp4"), "keep");
        Path staged = storage.stageThumbnail(UploadFixtures.image("png"));
        assertTrue(staged.startsWith(store.toRealPath().resolve("uploads/.pending")));
        assertThrows(IllegalArgumentException.class, () -> storage.publishThumbnail(staged, "../bad"));
        String published = storage.publishThumbnail(staged, "png");
        assertTrue(published.matches("uploads/thumbnails/[0-9a-f-]{36}\\.png"));
        assertFalse(Files.exists(staged));
        assertTrue(storage.pendingIds().isEmpty());

        // An upload-time or imported thumbnail must never match this flow's generated pattern.
        UUID uploadId = storage.begin();
        storage.write(uploadId, UploadFixtures.video(), false);
        storage.write(uploadId, UploadFixtures.image("jpg"), true);
        storage.nameThumbnail(uploadId, "jpg");
        storage.publish(uploadId);
        storage.finish(uploadId);
        String uploadThumbnail = storage.thumbnailPath(uploadId, "jpg");
        for (String path : new String[]{"original.mp4", "../original.mp4", uploadThumbnail,
                "uploads/thumbnails/../../original.mp4", ""}) {
            storage.deleteThumbnail(path);
        }
        storage.deleteThumbnail(null);
        assertEquals("keep", Files.readString(keep));
        assertTrue(Files.exists(store.resolve(uploadThumbnail)));
        storage.deleteThumbnail(published);
        assertFalse(Files.exists(store.resolve(published)));

        assertEquals(400, assertThrows(UploadException.class,
                () -> storage.stageThumbnail(new MockMultipartFile("thumbnail", new byte[0]))).getStatus());
        assertEquals(413, assertThrows(UploadException.class, () -> storage.stageThumbnail(
                new MockMultipartFile("thumbnail", new byte[(int) MediaFileValidator.THUMBNAIL_LIMIT + 1]))).getStatus());
        Path discarded = storage.stageThumbnail(UploadFixtures.image("jpg"));
        storage.discardStagedThumbnail(discarded);
        try (var pending = Files.list(store.resolve("uploads/.pending"))) {
            assertEquals(0, pending.count());
        }
    }

    @Test void refusesSymlinkedUploadDirectories() throws Exception {
        Path outside = Files.createDirectory(store.resolve("outside"));
        try { Files.createSymbolicLink(store.resolve("uploads"), outside); }
        catch (IOException | UnsupportedOperationException exception) {
            // Windows can require Developer Mode; canonical resource/path checks are also integration-tested.
            org.junit.jupiter.api.Assumptions.abort("Host does not allow creating symbolic links");
        }
        assertThrows(IOException.class, () -> storage().begin());
        assertEquals(0, Files.list(outside).count());
    }
}
