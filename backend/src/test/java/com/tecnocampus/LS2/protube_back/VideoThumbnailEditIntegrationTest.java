package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.services.MediaFileValidator;
import com.tecnocampus.LS2.protube_back.services.MediaStorageService;
import com.tecnocampus.LS2.protube_back.services.UploadException;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.services.VideoUploadService;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Replacing a video's thumbnail from the editor must never touch the thumbnail an upload wrote
 * (uploads/&lt;video-uuid&gt;/thumbnail.*) or an imported one; only the files this edit flow itself
 * publishes under uploads/thumbnails/ are ever removed, and only after the previous one has been
 * superseded and the owning transaction committed.
 */
class VideoThumbnailEditIntegrationTest extends PostgreSqlIntegrationTest {
    static final Path STORE;
    static {
        try {
            STORE = Files.createTempDirectory("protube-thumbnail-edit-test-").toRealPath();
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @DynamicPropertySource
    static void store(DynamicPropertyRegistry registry) {
        registry.add("pro_tube.store.dir", STORE::toString);
    }

    @Autowired UserService userService;
    @Autowired VideoUploadService uploads;
    @Autowired VideoService videoService;
    @Autowired MediaStorageService storage;

    @Test
    void replacingAnEditedThumbnailKeepsTheOriginalUploadThumbnailAndOnlyDeletesTheOneThisFlowPublished() throws Exception {
        Long owner = userService.register(new RegisterRequest(
                "thumbnail-edit@example.test", "thumbnail-edit", "First", "Last", "password123")).id();
        var uploaded = uploads.upload(
                new UploadVideoRequest("Original upload", "Description", "Education", List.of()),
                UploadFixtures.video(), UploadFixtures.image("jpg"), owner);
        String uploadThumbnailPath = uploaded.thumbnailUrl().replace("/media/", "");
        Path uploadThumbnailFile = STORE.resolve(uploadThumbnailPath);
        assertTrue(Files.exists(uploadThumbnailFile));

        // First edit-time replacement: a new uploads/thumbnails/<uuid>.png file is published and
        // referenced; the upload-time thumbnail is untouched because it is not this flow's own file.
        var firstEdit = videoService.updateVideo(uploaded.id(), new UpdateVideoRequest(null, null, null, null),
                owner, UploadFixtures.image("png"));
        String firstEditThumbnailPath = firstEdit.thumbnailUrl().replace("/media/", "");
        assertTrue(firstEditThumbnailPath.matches("uploads/thumbnails/[0-9a-f-]{36}\\.png"));
        Path firstEditThumbnailFile = STORE.resolve(firstEditThumbnailPath);
        assertTrue(Files.exists(firstEditThumbnailFile));
        assertTrue(Files.exists(uploadThumbnailFile), "upload-time thumbnail must survive an edit replacement");

        // Second edit-time replacement: this time the previous thumbnail being superseded was
        // itself published by this same flow, so it is removed after commit; the original
        // upload-time thumbnail still survives untouched.
        var secondEdit = videoService.updateVideo(uploaded.id(), new UpdateVideoRequest(null, null, null, null),
                owner, UploadFixtures.image("jpg"));
        String secondEditThumbnailPath = secondEdit.thumbnailUrl().replace("/media/", "");
        assertFalse(secondEditThumbnailPath.equals(firstEditThumbnailPath));
        assertTrue(Files.exists(STORE.resolve(secondEditThumbnailPath)));
        assertFalse(Files.exists(firstEditThumbnailFile), "a thumbnail this edit flow published is removed once superseded");
        assertTrue(Files.exists(uploadThumbnailFile), "upload-time thumbnail must still survive a second edit replacement");
        assertTrue(storage.pendingIds().isEmpty(), "no leftover pending manifests from this flow");
        // Replacing a thumbnail never touches the MP4 reference, the owner, or the view count.
        assertEquals(uploaded.videoUrl(), secondEdit.videoUrl());
        assertEquals(uploaded.user(), secondEdit.user());
        assertEquals(uploaded.viewsCount(), secondEdit.viewsCount());
    }

    @Test
    void anInvalidThumbnailLeavesTitleDescriptionTagsCategoryAndThePreviousThumbnailUnchanged() throws Exception {
        Long owner = userService.register(new RegisterRequest(
                "thumbnail-invalid@example.test", "thumbnail-invalid", "First", "Last", "password123")).id();
        var uploaded = uploads.upload(
                new UploadVideoRequest("Original upload", "Description", "Education", List.of()),
                UploadFixtures.video(), null, owner);

        var oversized = new MockMultipartFile("thumbnail", "big.png", "image/png",
                new byte[(int) MediaFileValidator.THUMBNAIL_LIMIT + 1]);
        assertThrows(UploadException.class, () -> videoService.updateVideo(uploaded.id(),
                new UpdateVideoRequest("New title", "New description", List.of("new"), "Music"), owner, oversized));

        var unchanged = videoService.updateVideo(uploaded.id(), new UpdateVideoRequest(null, null, null, null), owner);
        assertEquals("Original upload", unchanged.title());
        assertEquals("Description", unchanged.description());
        assertEquals(List.of(), unchanged.tags());
        assertEquals("Education", unchanged.category());
        assertTrue(unchanged.thumbnailUrl() == null || unchanged.thumbnailUrl().isEmpty());
        assertTrue(storage.pendingIds().isEmpty(), "a rejected thumbnail leaves no pending manifest behind");
    }
}
