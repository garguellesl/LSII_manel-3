package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
class PopularitySearchTest extends PostgreSqlIntegrationTest {
    @Autowired VideoService service;
    @Autowired JdbcTemplate jdbc;
    long owner;
    long first;
    long second;
    long third;
    long zero;
    long otherAudience;
    long unclassified;

    @BeforeEach
    void knownMetrics() {
        owner = user("owner");
        // Insertion order deliberately disagrees with popularity. Two tags must not double metrics.
        first = video("needle", "CHILDREN", List.of("rock", "pop"), 1, 3, 3);
        second = video("Other", "CHILDREN", List.of("rock"), 2, 0, 1);
        third = video("needle", "CHILDREN", List.of("pop"), 2, 1, 3);
        zero = video("needle", "CHILDREN", List.of("rock", "pop"), 0, 5, 0);
        otherAudience = video("needle", "NOT_CHILDREN", List.of("rock"), 5, 0, 5);
        unclassified = video("needle", "UNCLASSIFIED", List.of("pop"), 0, 0, 0);
        video("needle", "CHILDREN", List.of("jazz"), 8, 0, 8);
        long wrongText = video("unrelated", "CHILDREN", List.of("rock"), 9, 0, 9);
        jdbc.update("update videos set description = '' where id = ?", wrongText);
        // Watch history is not a reproduction counter.
        for (int i = 0; i < 10; i++) {
            jdbc.update("insert into watch_history(user_id,video_id,progress_seconds) values (?, ?, 1)", owner, zero);
        }
    }

    @Test
    void positiveLikesOverrideRelevanceAcrossPagesWithStableTiesAndExactTotals() {
        assertPages("likes", List.of(second, third, first, zero));
        var page = service.getVideos("needle", List.of("rock", "pop"), 0, 4, "likes", "CHILDREN");
        assertEquals(List.of(2L, 2L, 1L, 0L), page.content().stream().map(VideoSummary::likesCount).toList());
        assertEquals(5, page.content().get(3).dislikesCount());
        // More matched tags still win only when relevance is selected.
        assertEquals(List.of(first, zero, third, second), ids("relevance", "CHILDREN"));
    }

    @Test
    void persistedPlaysOverrideRelevanceAndHistoryIncludingZeros() {
        assertPages("views", List.of(first, third, second, zero));
        var page = service.getVideos("needle", List.of("rock", "pop"), 0, 4, "views", "CHILDREN");
        assertEquals(List.of(3L, 3L, 1L, 0L), page.content().stream().map(VideoSummary::viewsCount).toList());
    }

    @Test
    void allAudiencesIncludeUnclassifiedAndRestrictedAudienceIsExact() {
        assertEquals(List.of(otherAudience, second, third, first, zero, unclassified), ids("likes", "ALL"));
        assertEquals(List.of(otherAudience), ids("views", "NOT_CHILDREN"));
        assertEquals(8, service.getVideos("", List.of(), 0, 24, "views", "ALL").totalElements());
        assertEquals(6, service.getVideos("", List.of(), 0, 24, "likes", "CHILDREN").totalElements());
    }

    @Test
    void emptyResultsOutOfRangeAndInvalidCriteriaAreControlled() {
        for (String sort : List.of("relevance", "likes", "views")) {
            var empty = service.getVideos("missing", List.of("rock"), 0, 2, sort, "CHILDREN");
            assertEquals(0, empty.totalElements());
            assertTrue(empty.content().isEmpty());
            assertFalse(empty.hasNext());
            var outside = service.getVideos("needle", List.of("rock", "pop"), 20, 2, sort, "CHILDREN");
            assertEquals(4, outside.totalElements());
            assertTrue(outside.content().isEmpty());
        }
        assertThrows(IllegalArgumentException.class, () -> service.getVideos("", List.of(), 0, 24, "invalid", "ALL"));
        assertThrows(IllegalArgumentException.class, () -> service.getVideos("", List.of(), 0, 24, "likes", "invalid"));
    }

    private List<Long> ids(String sort, String audience) {
        return service.getVideos(" NEEDLE ", List.of(" ROCK ", "pop", "rock"), 0, 24, sort, audience)
                .content().stream().map(VideoSummary::id).toList();
    }

    private void assertPages(String sort, List<Long> expected) {
        var actual = new ArrayList<Long>();
        for (int page = 0; page < 4; page++) {
            var result = service.getVideos("needle", List.of("rock", "pop"), page, 1, sort, "CHILDREN");
            assertEquals(4, result.totalElements());
            assertEquals(page < 3, result.hasNext());
            actual.addAll(result.content().stream().map(VideoSummary::id).toList());
        }
        assertEquals(expected, actual);
        assertEquals(actual.size(), actual.stream().distinct().count());
    }

    private long user(String name) {
        String unique = name + UUID.randomUUID();
        return jdbc.queryForObject("""
                insert into app_users(email,account_name,first_name,last_name,password_hash)
                values (?, ?, 'Test', 'Search', 'unused') returning id
                """, Long.class, unique + "@example.com", unique);
    }

    private long video(String title, String audience, List<String> tags, int likes, int dislikes, int plays) {
        long id = jdbc.queryForObject("""
                insert into videos(title,description,media_path,owner_user_id,audience)
                values (?, 'needle description', ?, ?, ?) returning id
                """, Long.class, title, UUID.randomUUID() + ".mp4", owner, audience);
        for (String tag : tags) {
            jdbc.update("insert into tags(name) values (?) on conflict do nothing", tag);
            jdbc.update("insert into video_tags(video_id,tag_id) select ?,id from tags where name=?", id, tag);
        }
        for (int i = 0; i < likes + dislikes; i++) {
            jdbc.update("insert into video_likes(video_id,user_id,reaction_type) values (?, ?, ?)",
                    id, user("reaction"), i < likes ? "LIKE" : "DISLIKE");
        }
        for (int i = 0; i < plays; i++) {
            jdbc.update("insert into video_plays(id,video_id) values (?, ?)", UUID.randomUUID(), id);
        }
        return id;
    }
}
