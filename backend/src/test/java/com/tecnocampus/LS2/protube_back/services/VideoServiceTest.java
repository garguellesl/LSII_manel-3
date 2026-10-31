package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateCommentRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryRequest;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Transactional
class VideoServiceTest extends PostgreSqlIntegrationTest {

    @Autowired
    UserService userService;

    @Autowired
    VideoService videoService;

    @Test
    void createsAndReturnsVideoMetadataFromDatabase() {
        Long userId = registerUser("one@example.com", "one").id();

        var created = videoService.createVideo(new CreateVideoRequest(
                "First",
                "A description",
                "1.mp4",
                "1.webp",
                12.5,
                userId,
                List.of("Java", "spring")
        ));

        assertEquals("First", created.title());
        assertEquals("/media/1.mp4", created.videoUrl());
        assertEquals(List.of("java", "spring"), created.tags());
        assertEquals(created, videoService.getVideo(created.id()).orElseThrow());
        assertEquals(1, videoService.getVideos().size());
    }

    @Test
    void createsVideoWithDescriptionLongerThanTwoThousandCharacters() {
        Long userId = registerUser("long-description@example.com", "long-description").id();
        String description = "a".repeat(2730);

        var created = videoService.createVideo(new CreateVideoRequest(
                "Long description",
                description,
                "long-description.mp4",
                null,
                0,
                userId,
                List.of()
        ));

        assertEquals(description, created.description());
    }

    @Test
    void rejectsUnsafeStorePaths() {
        Long userId = registerUser("two@example.com", "two").id();

        assertThrows(IllegalArgumentException.class, () -> videoService.createVideo(new CreateVideoRequest(
                "Unsafe",
                "",
                "../secret.mp4",
                null,
                0,
                userId,
                List.of()
        )));
    }

    @Test
    void updatesDescriptionAndTags() {
        Long userId = registerUser("three@example.com", "three").id();
        Long videoId = createVideo(userId, "3.mp4").id();

        var updated = videoService.updateVideo(videoId, new UpdateVideoRequest(
                null,
                "New description",
                List.of("database")
        ));

        assertEquals("New description", updated.description());
        assertEquals(List.of("database"), updated.tags());
    }

    @Test
    void createsVideoWithoutTagsWhenTagsFieldIsAbsentOrNull() {
        Long userId = registerUser("tags-absent@example.com", "tags-absent").id();

        var created = videoService.createVideo(new CreateVideoRequest(
                "No tags",
                "Description",
                "no-tags.mp4",
                null,
                0,
                userId,
                null
        ));

        assertEquals(List.of(), created.tags());
    }

    @Test
    void nullTagsOnUpdateLeavesExistingTagsUnchanged() {
        Long userId = registerUser("tags-null-update@example.com", "tags-null-update").id();
        Long videoId = createVideoWithTags(userId, "tags-null-update.mp4", List.of("kept")).id();

        var updated = videoService.updateVideo(videoId, new UpdateVideoRequest(
                "New title",
                null,
                null
        ));

        assertEquals(List.of("kept"), updated.tags());
    }

    @Test
    void emptyTagsListOnUpdateClearsAllTags() {
        Long userId = registerUser("tags-empty-update@example.com", "tags-empty-update").id();
        Long videoId = createVideoWithTags(userId, "tags-empty-update.mp4", List.of("removable")).id();

        var updated = videoService.updateVideo(videoId, new UpdateVideoRequest(
                null,
                null,
                List.of()
        ));

        assertEquals(List.of(), updated.tags());
    }

    @Test
    void invalidTagOnCreationThrowsAndDoesNotCreateVideo() {
        Long userId = registerUser("tags-invalid-create@example.com", "tags-invalid-create").id();

        assertThrows(InvalidTagsException.class, () -> videoService.createVideo(new CreateVideoRequest(
                "Invalid tags",
                "Description",
                "invalid-tags.mp4",
                null,
                0,
                userId,
                List.of("", "rock")
        )));

        assertEquals(List.of(), videoService.getVideos());
    }

    @Test
    void invalidTagOnUpdateThrowsAndDoesNotChangeExistingTags() {
        Long userId = registerUser("tags-invalid-update@example.com", "tags-invalid-update").id();
        Long videoId = createVideoWithTags(userId, "tags-invalid-update.mp4", List.of("original")).id();

        assertThrows(InvalidTagsException.class, () -> videoService.updateVideo(videoId, new UpdateVideoRequest(
                "New title",
                "New description",
                List.of("what;s up")
        )));

        var unchanged = videoService.getVideo(videoId).orElseThrow();
        assertEquals("Title", unchanged.title());
        assertEquals("Description", unchanged.description());
        assertEquals(List.of("original"), unchanged.tags());
    }

    @Test
    void twoVideosSharingATagRemainIndependentWhenEditingOne() {
        Long ownerOneId = registerUser("shared-tag-one@example.com", "shared-tag-one").id();
        Long ownerTwoId = registerUser("shared-tag-two@example.com", "shared-tag-two").id();
        Long videoOneId = createVideoWithTags(ownerOneId, "shared-tag-one.mp4", List.of("shared")).id();
        Long videoTwoId = createVideoWithTags(ownerTwoId, "shared-tag-two.mp4", List.of("shared")).id();

        videoService.updateVideo(videoOneId, new UpdateVideoRequest(null, null, List.of("renamed")));

        var videoOne = videoService.getVideo(videoOneId).orElseThrow();
        var videoTwo = videoService.getVideo(videoTwoId).orElseThrow();
        assertEquals(List.of("renamed"), videoOne.tags());
        assertEquals(List.of("shared"), videoTwo.tags());
    }

    @Test
    void recordsCommentsLikesWatchHistoryAndAnalytics() {
        Long userId = registerUser("four@example.com", "four").id();
        Long videoId = createVideo(userId, "4.mp4").id();

        var comment = videoService.addComment(videoId, new CommentRequest(userId, "Nice video"));
        var updatedComment = videoService.updateComment(comment.id(), new UpdateCommentRequest("Updated comment"));
        var like = videoService.likeVideo(videoId, userId);
        var watch = videoService.recordWatch(videoId, new WatchHistoryRequest(userId, 7));
        var analytics = videoService.getAnalyticsForOwner(userId).get(0);

        assertEquals("Nice video", comment.text());
        assertEquals("Updated comment", updatedComment.text());
        assertTrue(like.liked());
        assertEquals(7, watch.progressSeconds());
        assertEquals(1, analytics.commentsCount());
        assertEquals(1, analytics.likesCount());
        assertEquals(1, analytics.viewsCount());
        assertEquals(1, videoService.getWatchHistory(userId).size());
    }

    @Test
    void returnsEmptyVideoListWhenNoVideosExist() {
        assertEquals(List.of(), videoService.getVideos());
    }

    @Test
    void missingVideoReturnsEmptyForDetail() {
        assertTrue(videoService.getVideo(99L).isEmpty());
    }

    @Test
    void addingCommentToMissingVideoThrowsNotFound() {
        Long userId = registerUser("five@example.com", "five").id();

        assertThrows(ResourceNotFoundException.class,
                () -> videoService.addComment(99L, new CommentRequest(userId, "Missing video")));
    }

    private com.tecnocampus.LS2.protube_back.model.UserResponse registerUser(String email, String accountName) {
        return userService.register(new RegisterRequest(email, accountName, "First", "Last", "password123"));
    }

    private com.tecnocampus.LS2.protube_back.model.VideoDetail createVideo(Long userId, String mediaPath) {
        return videoService.createVideo(new CreateVideoRequest(
                "Title",
                "Description",
                mediaPath,
                null,
                0,
                userId,
                List.of()
        ));
    }

    private com.tecnocampus.LS2.protube_back.model.VideoDetail createVideoWithTags(
            Long userId, String mediaPath, List<String> tags
    ) {
        return videoService.createVideo(new CreateVideoRequest(
                "Title",
                "Description",
                mediaPath,
                null,
                0,
                userId,
                tags
        ));
    }
}
