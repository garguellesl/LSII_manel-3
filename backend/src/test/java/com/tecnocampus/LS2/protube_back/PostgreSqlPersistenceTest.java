package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.services.CommentService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PostgreSqlPersistenceTest {

    @Test
    void upgradingV3PreservesHistoricalCommentsAndEnforcesThreadAndLikeIntegrity() {
        try (var database = new PostgreSQLContainer<>("postgres:16-alpine").withPassword(UUID.randomUUID().toString())) {
            database.start();
            org.flywaydb.core.Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                    .target("3").load().migrate();
            var jdbc = new JdbcTemplate(new org.springframework.jdbc.datasource.DriverManagerDataSource(
                    database.getJdbcUrl(), database.getUsername(), database.getPassword()));
            jdbc.update("INSERT INTO app_users (id,email,account_name,first_name,last_name,password_hash) VALUES (1,'old@example.test','old','First','Last','test')");
            jdbc.update("INSERT INTO videos (id,title,description,media_path,owner_user_id) VALUES (1,'First','','first.mp4',1),(2,'Second','','second.mp4',1)");
            jdbc.update("INSERT INTO comments (id,video_id,user_id,text,created_at,updated_at) VALUES (10,1,1,'historical',timestamp '2020-01-01',timestamp '2020-02-01')");
            org.flywaydb.core.Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword()).load().migrate();
            assertEquals("historical", jdbc.queryForObject("select text from comments where id=10", String.class));
            assertEquals(2020, jdbc.queryForObject("select extract(year from created_at) from comments where id=10", Integer.class));
            assertTrue(jdbc.queryForObject("select parent_id is null and deleted_at is null from comments where id=10", Boolean.class));
            org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> jdbc.update("insert into comments (video_id,user_id,text,parent_id) values (2,1,'wrong video',10)"));
            org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> jdbc.update("insert into comments (video_id,user_id,text,parent_id) values (1,1,'missing parent',999)"));
            jdbc.update("insert into comments (video_id,user_id,text,parent_id) values (1,1,'child',10)");
            jdbc.update("insert into comment_likes (comment_id,user_id) values (10,1)");
            org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> jdbc.update("insert into comment_likes (comment_id,user_id) values (10,1)"));
            org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> jdbc.update("delete from comments where id=10"));
            // A video deletion still cascades its entire discussion and likes, without a dangling parent FK.
            jdbc.update("delete from videos where id=1");
            assertEquals(0L, jdbc.queryForObject("select count(*) from comments", Long.class));
            assertEquals(0L, jdbc.queryForObject("select count(*) from comment_likes", Long.class));
        }
    }

    @Test
    void upgradingV2MarksExistingTagsButLeavesLegacyEmptyVideosEligibleForBackfill() {
        try (var database = new PostgreSQLContainer<>("postgres:16-alpine")
                .withPassword(UUID.randomUUID().toString())) {
            database.start();
            org.flywaydb.core.Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(),
                    database.getPassword()).target("2").load().migrate();
            var jdbc = new JdbcTemplate(new org.springframework.jdbc.datasource.DriverManagerDataSource(
                    database.getJdbcUrl(), database.getUsername(), database.getPassword()));
            jdbc.update("INSERT INTO app_users (id,email,account_name,first_name,last_name,password_hash) VALUES (1,'migration@example.test','migration','First','Last','test')");
            jdbc.update("INSERT INTO videos (id,title,description,media_path,owner_user_id) VALUES (1,'Tagged','','tagged.mp4',1),(2,'Empty','','empty.mp4',1)");
            jdbc.update("INSERT INTO tags (id,name) VALUES (1,'rock')");
            jdbc.update("INSERT INTO video_tags (video_id,tag_id) VALUES (1,1)");
            org.flywaydb.core.Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(),
                    database.getPassword()).load().migrate();
            assertEquals(List.of(true, false), jdbc.queryForList(
                    "SELECT tags_initialized FROM videos ORDER BY id", Boolean.class));
            assertEquals(1L, jdbc.queryForObject("SELECT count(*) FROM video_tags", Long.class));
        }
    }

    @Test
    void preservesCoreDataBetweenDevAndProdRestartsAndSupportsRepositoryCrud() {
        try (var database = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("protube_restart")
                .withPassword(UUID.randomUUID().toString())) {
            database.start();
            Long userId;
            Long videoId;
            Long commentId;
            Long replyId;
            String description = "Persistent PostgreSQL description. ".repeat(100).trim();

            try (var application = startApplication(database, "dev")) {
                var user = application.getBean(UserService.class).register(new RegisterRequest(
                        "persist@example.com", "persistent", "Persist", "User", "password123"
                ));
                userId = user.id();
                var videos = application.getBean(VideoService.class);
                videoId = videos.createVideo(new CreateVideoRequest(
                        "Persistent video", description, "persistent.mp4", null, 10,
                        userId, List.of("Java", "PostgreSQL")
                )).id();
                var comments = application.getBean(CommentService.class);
                commentId = comments.addComment(videoId, new CommentRequest("Persisted comment", null), userId).id();
                replyId = comments.addComment(videoId, new CommentRequest("Reply", commentId), userId).id();
                comments.addComment(videoId, new CommentRequest("Nested", replyId), userId);
                comments.updateComment(replyId, new com.tecnocampus.LS2.protube_back.model.UpdateCommentRequest("Edited reply"), userId);
                comments.setLike(replyId, userId, true);
                comments.deleteComment(commentId, userId);
                videos.likeVideo(videoId, userId);
                videos.recordWatch(videoId, new WatchHistoryRequest(userId, 5));

                var jdbc = application.getBean(JdbcTemplate.class);
                assertEquals(List.of("1", "2", "3", "4"), jdbc.queryForList(
                        "select version from flyway_schema_history where success order by installed_rank",
                        String.class));
                assertEquals("PostgreSQL", jdbc.execute(
                        (org.springframework.jdbc.core.ConnectionCallback<String>) connection ->
                                connection.getMetaData().getDatabaseProductName()));
            }

            // A new application context, using prod rather than dev, must read the same committed data.
            try (var application = startApplication(database, "prod")) {
                var users = application.getBean(UserAccountRepository.class);
                var videos = application.getBean(VideoService.class);
                var persistedUser = users.findById(userId).orElseThrow();
                assertEquals("persist@example.com", persistedUser.getEmail());
                assertEquals("Persist", persistedUser.getFirstName());
                assertEquals("User", persistedUser.getLastName());
                var persistedVideo = videos.getVideo(videoId).orElseThrow();
                assertEquals(description, persistedVideo.description());
                assertEquals(List.of("java", "postgresql"), persistedVideo.tags());
                var discussion = application.getBean(CommentService.class).getComments(videoId, userId);
                assertEquals(3, discussion.size());
                assertEquals("Comment deleted", discussion.getFirst().text());
                assertEquals(commentId, discussion.get(1).parentId());
                assertEquals("Edited reply", discussion.get(1).text());
                assertEquals(1, discussion.get(1).likesCount());
                assertTrue(discussion.get(1).likedByMe());
                assertEquals(replyId, discussion.get(2).parentId());
                assertEquals(1, videos.getWatchHistory(userId, userId).size());
                assertEquals(1, videos.getAnalyticsForOwner(userId, userId).getFirst().likesCount());

                videos.updateVideo(videoId, new UpdateVideoRequest(null, "Updated after restart", List.of("java")), userId);
                assertEquals("Updated after restart", videos.getVideo(videoId).orElseThrow().description());

                application.getBean(VideoRepository.class).deleteById(videoId);
                assertTrue(videos.getVideo(videoId).isEmpty());
                var jdbc = application.getBean(JdbcTemplate.class);
                for (String table : List.of("video_tags", "comments", "comment_likes", "video_likes", "watch_history")) {
                    assertEquals(0L, jdbc.queryForObject("select count(*) from " + table, Long.class));
                }
                // Removing a video's associations must not remove shared tag values.
                assertEquals(2L, jdbc.queryForObject("select count(*) from tags", Long.class));
                users.deleteById(userId);
                assertTrue(users.findById(userId).isEmpty());
            }
        }
    }

    @Test
    void reimportingAttachesTagsOnceWithoutDuplicatingVideosOrAssociations() throws Exception {
        try (var database = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("protube_tag_import")
                .withPassword(UUID.randomUUID().toString())) {
            database.start();
            Path storeDirectory = Files.createTempDirectory("protube-import-tags");
            try {
                Files.writeString(storeDirectory.resolve("imported.json"),
                        "{\"title\":\"Imported\",\"duration\":1,\"meta\":{\"description\":\"d\",\"tags\":[\"Live\",\"live \"]}}");
                Files.writeString(storeDirectory.resolve("imported.mp4"), "");
                Files.writeString(storeDirectory.resolve("imported.webp"), "");

                try (var application = startApplicationImportingFrom(database, storeDirectory)) {
                    var videos = application.getBean(VideoService.class);
                    var page = videos.getVideos("", 0, 24);
                    assertEquals(1, page.content().size());
                    Long videoId = page.content().get(0).id();
                    assertEquals(List.of("live"), videos.getVideo(videoId).orElseThrow().tags());

                    var jdbc = application.getBean(JdbcTemplate.class);
                    assertEquals(1L, jdbc.queryForObject("select count(*) from videos", Long.class));
                    assertEquals(1L, jdbc.queryForObject("select count(*) from tags", Long.class));
                    assertEquals(1L, jdbc.queryForObject("select count(*) from video_tags", Long.class));
                }

                // Reimporting from the same store onto the same database must not duplicate the video, the tag or the association.
                try (var application = startApplicationImportingFrom(database, storeDirectory)) {
                    var videos = application.getBean(VideoService.class);
                    var page = videos.getVideos("", 0, 24);
                    assertEquals(1, page.content().size());
                    Long videoId = page.content().get(0).id();
                    assertEquals(List.of("live"), videos.getVideo(videoId).orElseThrow().tags());

                    var jdbc = application.getBean(JdbcTemplate.class);
                    assertEquals(1L, jdbc.queryForObject("select count(*) from videos", Long.class));
                    assertEquals(1L, jdbc.queryForObject("select count(*) from tags", Long.class));
                    assertEquals(1L, jdbc.queryForObject("select count(*) from video_tags", Long.class));
                }
                // An owner's explicit empty selection survives the next application restart/import.
                try (var application = startApplicationImportingFrom(database, storeDirectory)) {
                    var videos = application.getBean(VideoService.class);
                    Long videoId = videos.getVideos("", 0, 24).content().get(0).id();
                    var owner = application.getBean(JdbcTemplate.class).queryForObject(
                            "select owner_user_id from videos where id = ?", Long.class, videoId);
                    videos.updateVideo(videoId, new UpdateVideoRequest(null, null, List.of()), owner);
                }
                try (var application = startApplicationImportingFrom(database, storeDirectory)) {
                    var videos = application.getBean(VideoService.class);
                    Long videoId = videos.getVideos("", 0, 24).content().get(0).id();
                    assertEquals(List.of(), videos.getVideo(videoId).orElseThrow().tags());
                    var jdbc = application.getBean(JdbcTemplate.class);
                    assertEquals(0L, jdbc.queryForObject("select count(*) from video_tags", Long.class));
                    assertEquals(1L, jdbc.queryForObject("select count(*) from tags", Long.class));
                    assertTrue(jdbc.queryForObject("select tags_initialized from videos where id = ?", Boolean.class, videoId));
                }

            } finally {
                try (var files = Files.walk(storeDirectory)) {
                    files.sorted(Comparator.reverseOrder()).forEach(path -> path.toFile().delete());
                }
            }
        }
    }

    private ConfigurableApplicationContext startApplicationImportingFrom(PostgreSQLContainer<?> database, Path storeDirectory) {
        return new SpringApplicationBuilder(ProtubeBackApplication.class).run(
                "--spring.profiles.active=dev",
                "--ENV_PROTUBE_DB_HOST=" + database.getHost(),
                "--ENV_PROTUBE_DB_PORT=" + database.getMappedPort(5432),
                "--ENV_PROTUBE_DB=" + database.getDatabaseName(),
                "--ENV_PROTUBE_DB_USER=" + database.getUsername(),
                "--ENV_PROTUBE_DB_PASS=" + database.getPassword(),
                "--pro_tube.store.dir=" + storeDirectory,
                "--pro_tube.load_initial_data=true",
                "--pro_tube.demo-admin.password=demo-password123",
                "--server.port=0",
                "--logging.level.org.springframework.web=INFO"
        );
    }

    private ConfigurableApplicationContext startApplication(PostgreSQLContainer<?> database, String profile) {
        return new SpringApplicationBuilder(ProtubeBackApplication.class).run(
                "--spring.profiles.active=" + profile,
                "--ENV_PROTUBE_DB_HOST=" + database.getHost(),
                "--ENV_PROTUBE_DB_PORT=" + database.getMappedPort(5432),
                "--ENV_PROTUBE_DB=" + database.getDatabaseName(),
                "--ENV_PROTUBE_DB_USER=" + database.getUsername(),
                "--ENV_PROTUBE_DB_PASS=" + database.getPassword(),
                "--pro_tube.store.dir=.",
                "--pro_tube.load_initial_data=false",
                "--server.port=0",
                "--logging.level.org.springframework.web=INFO"
        );
    }
}
