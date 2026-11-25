package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.RecommendedVideo;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@Transactional
class RecommendationTest extends PostgreSqlIntegrationTest {
    @Autowired JdbcTemplate db;
    @Autowired VideoService service;

    @Test
    void ranksByPrivateRecentHistoryThenSharedTagsAndAppliesEligibilityBeforeLimit() {
        long viewer = db.queryForObject("""
                insert into app_users(email,account_name,first_name,last_name,password_hash)
                values ('rec@example.test','rec','First','Last','unused') returning id
                """, Long.class);
        var ids = db.queryForList("""
                insert into videos(title,description,media_path,owner_user_id,audience)
                select 'Recommendation','','rec-' || n,?, 'CHILDREN' from generate_series(1,13) n
                order by n returning id
                """, Long.class, viewer);
        long source = ids.get(0), related = ids.get(1), favourite = ids.get(2);
        long contextualTag = db.queryForObject("insert into tags(name) values ('context') returning id", Long.class);
        long historyTag = db.queryForObject("insert into tags(name) values ('interest') returning id", Long.class);
        db.update("insert into video_tags(video_id,tag_id) values (?,?),(?,?),(?,?)",
                source, contextualTag, related, contextualTag, favourite, historyTag);
        db.update("insert into watch_history(user_id,video_id) values (?,?)", viewer, favourite);
        db.update("update videos set audience='NOT_CHILDREN' where id=?", ids.get(3));
        db.update("delete from videos where id=?", ids.get(4));
        var guest = service.recommendations(source, null, "CHILDREN").stream().map(RecommendedVideo::id).toList();
        assertEquals(related, guest.getFirst());
        assertEquals(8, guest.stream().distinct().count());
        assertTrue(java.util.Collections.disjoint(guest, List.of(source, ids.get(3), ids.get(4))));
        assertEquals(favourite, service.recommendations(source, viewer, "CHILDREN").getFirst().id());
        db.update("insert into watch_history(user_id,video_id) select ?,? from generate_series(1,20)",viewer,source);
        assertEquals(related, service.recommendations(source, viewer, "CHILDREN").getFirst().id());
        assertThrows(IllegalArgumentException.class, () -> service.recommendations(source,null,"INVALID"));
        assertThrows(ResourceNotFoundException.class, () -> service.recommendations(-1L,null,"ALL"));
    }
}
