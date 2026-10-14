package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateCommentRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest({
        "pro_tube.store.dir=.",
        "pro_tube.load_initial_data=false"
})
@Transactional
class VideoServiceTest {

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
}
