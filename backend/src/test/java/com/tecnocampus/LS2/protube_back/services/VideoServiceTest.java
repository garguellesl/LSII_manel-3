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
        assertEquals(1, videoService.getVideos("", 0, 24).content().size());
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
        ), userId);

        assertEquals("New description", updated.description());
        assertEquals(List.of("database"), updated.tags());
    }

    @Test
    void recordsCommentsLikesWatchHistoryAndAnalytics() {
        Long userId = registerUser("four@example.com", "four").id();
        Long videoId = createVideo(userId, "4.mp4").id();

        var comment = videoService.addComment(videoId, new CommentRequest(userId, "Nice video"));
        var updatedComment = videoService.updateComment(comment.id(), new UpdateCommentRequest("Updated comment"), userId);
        var like = videoService.likeVideo(videoId, userId);
        var watch = videoService.recordWatch(videoId, new WatchHistoryRequest(userId, 7));
        var analytics = videoService.getAnalyticsForOwner(userId, userId).get(0);

        assertEquals("Nice video", comment.text());
        assertEquals("Updated comment", updatedComment.text());
        assertTrue(like.liked());
        assertEquals(7, watch.progressSeconds());
        assertEquals(1, analytics.commentsCount());
        assertEquals(1, analytics.likesCount());
        assertEquals(1, analytics.viewsCount());
        assertEquals(1, videoService.getWatchHistory(userId, userId).size());
    }

    @Test
    void returnsEmptyVideoListWhenNoVideosExist() {
        assertEquals(List.of(), videoService.getVideos("", 0, 24).content());
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

    @Test
    void searchesDescriptionsAndTitlesWithStableRankingAndDatabasePagination() {
        Long owner = registerUser("search@example.com", "search").id();
        var description = videoService.createVideo(new CreateVideoRequest("Other", "Learn JAVA today", "search1.mp4", null, 0, owner, List.of("one", "two")));
        var partial = videoService.createVideo(new CreateVideoRequest("Java tutorial", "Other", "search2.mp4", null, 0, owner, List.of()));
        var exact = videoService.createVideo(new CreateVideoRequest("Java", "Other", "search3.mp4", null, 0, owner, List.of()));
        var first = videoService.getVideos("  jAvA  ", 0, 2);
        assertEquals(List.of(exact.id(), partial.id()), first.content().stream().map(v -> v.id()).toList());
        assertTrue(first.hasNext());
        assertEquals(3, first.totalElements());
        var second = videoService.getVideos("java", 1, 2);
        assertEquals(List.of(description.id()), second.content().stream().map(v -> v.id()).toList());
        assertTrue(!second.hasNext());
        assertEquals(3, second.totalElements());
        assertEquals(List.of(description.id(), partial.id()), videoService.getVideos("  ", 0, 2).content().stream().map(v -> v.id()).toList());
        assertTrue(videoService.getVideos("missing", 0, 24).content().isEmpty());
        assertTrue(videoService.getVideos("java", 9, 2).content().isEmpty());
        assertEquals(3, videoService.getVideos("java", 9, 2).totalElements());
        assertEquals(3, videoService.getVideos(null, 0, 100).content().size());
    }

    @Test
    void treatsLikeWildcardsAndBackslashesAsLiteralText() {
        Long owner = registerUser("literal@example.com", "literal").id();
        var literal = videoService.createVideo(new CreateVideoRequest("100%_done", "A back\\slash", "literal.mp4", null, 0, owner, List.of()));
        videoService.createVideo(new CreateVideoRequest("100Xdone", "Different", "other.mp4", null, 0, owner, List.of()));
        for (String query : List.of("%", "_", "\\", "100%_")) {
            assertEquals(List.of(literal.id()), videoService.getVideos(query, 0, 24).content().stream().map(v -> v.id()).toList());
        }
    }

    @Test
    void countsFilteredResultsWithoutLoadingTheWholeCatalog() {
        Long owner = registerUser("count@example.com", "count").id();
        for (int index = 0; index < 25; index++) {
            videoService.createVideo(new CreateVideoRequest("Catalog " + index,
                    index == 0 ? "Unique description" : "Shared description",
                    "count-" + index + ".mp4", null, 0, owner, List.of("one", "two")));
        }
        var first = videoService.getVideos("", 0, 24);
        assertEquals(24, first.content().size());
        assertEquals(25, first.totalElements());
        assertTrue(first.hasNext());
        var last = videoService.getVideos("", 1, 24);
        assertEquals(1, last.content().size());
        assertEquals(25, last.totalElements());
        assertTrue(!last.hasNext());
        var single = videoService.getVideos("unique", 0, 24);
        assertEquals(1, single.content().size());
        assertEquals(1, single.totalElements());
        var exactPage = videoService.getVideos("shared", 0, 24);
        assertEquals(24, exactPage.content().size());
        assertEquals(24, exactPage.totalElements());
        assertTrue(!exactPage.hasNext());
        assertEquals(0, videoService.getVideos("missing", 0, 24).totalElements());
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
