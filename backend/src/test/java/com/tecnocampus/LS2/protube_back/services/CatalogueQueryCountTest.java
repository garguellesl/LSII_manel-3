package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
class CatalogueQueryCountTest extends PostgreSqlIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;
    @Autowired VideoService videos;

    @Test
    void pagesHaveBoundedQueriesAndIndependentCounts() {
        long owner = jdbc.queryForObject("""
                insert into app_users(email,account_name,first_name,last_name,password_hash)
                values ('catalogue@example.test','catalogue','First','Last','unused') returning id
                """, Long.class);
        List<Long> ids = jdbc.queryForList("""
                insert into videos(title,description,media_path,owner_user_id)
                select 'Catalogue probe','','probe-' || n || '.mp4',? from generate_series(1,25) n
                order by n returning id
                """, Long.class, owner);
        long first = ids.getFirst();
        jdbc.update("insert into tags(name) values ('z-probe'), ('a-probe')");
        jdbc.update("insert into video_tags select ?,id from tags where name in ('z-probe','a-probe')", first);
        jdbc.update("insert into video_likes(video_id,user_id,reaction_type) values (?,?,'DISLIKE'),(?,?,'LIKE')",
                first, owner, ids.get(1), owner);
        jdbc.update("insert into comments(video_id,user_id,text,deleted_at) values (?,?,'a',null),(?,?,'b',now())",
                first, owner, first, owner);
        jdbc.update("insert into video_plays(id,video_id) values (gen_random_uuid(),?),(gen_random_uuid(),?)",
                first, first);

        var stats = em.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        boolean previous = stats.isStatisticsEnabled();
        stats.setStatisticsEnabled(true);
        try {
            for (int size : List.of(1, 6, 24)) {
                em.clear();
                long start = stats.getPrepareStatementCount();
                var page = videos.getVideos("Catalogue probe", 0, size);
                long queries = stats.getPrepareStatementCount() - start;
                assertTrue(queries > 0 && queries <= 6, "page size " + size + " issued " + queries + " statements");
                assertEquals(ids.subList(0, size), page.content().stream().map(VideoSummary::id).toList());
                assertTrue(page.hasNext());
                assertEquals(25, page.totalElements());
                assertEquals(new VideoSummary(first, "Catalogue probe", null, "/media/probe-1.mp4",
                        List.of("a-probe", "z-probe"), 0, 1, 2, 1), page.content().getFirst());
                if (size > 1) {
                    assertEquals(new VideoSummary(ids.get(1), "Catalogue probe", null, "/media/probe-2.mp4",
                            List.of(), 1, 0, 0, 0), page.content().get(1));
                }
            }
            em.clear();
            var filtered = videos.getVideos("Catalogue probe", List.of("a-probe"), 0, 24);
            assertEquals(List.of("a-probe","z-probe"), filtered.content().getFirst().tags());
            assertEquals(1, filtered.totalElements());
            var last = videos.getVideos("Catalogue probe", 1, 24);
            assertEquals(List.of(ids.getLast()), last.content().stream().map(VideoSummary::id).toList());
            assertFalse(last.hasNext());
            long start = stats.getPrepareStatementCount();
            assertTrue(videos.getVideos("no-probe-match", 0, 24).content().isEmpty());
            assertTrue(stats.getPrepareStatementCount() - start <= 2);
        } finally {
            stats.setStatisticsEnabled(previous);
        }
    }
}
