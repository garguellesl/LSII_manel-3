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
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PostgreSqlPersistenceTest {

    @Test
    void preservesCoreDataBetweenDevAndProdRestartsAndSupportsRepositoryCrud() {
        try (var database = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("protube_restart")
                .withPassword(UUID.randomUUID().toString())) {
            database.start();
            Long userId;
            Long videoId;
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
                videos.addComment(videoId, new CommentRequest(userId, "Persisted comment"));
                videos.likeVideo(videoId, userId);
                videos.recordWatch(videoId, new WatchHistoryRequest(userId, 5));

                var jdbc = application.getBean(JdbcTemplate.class);
                assertEquals(List.of("1", "2"), jdbc.queryForList(
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
                assertEquals(1, videos.getComments(videoId).size());
                assertEquals(1, videos.getWatchHistory(userId).size());
                assertEquals(1, videos.getAnalyticsForOwner(userId).getFirst().likesCount());

                videos.updateVideo(videoId, new UpdateVideoRequest(null, "Updated after restart", List.of("java")));
                assertEquals("Updated after restart", videos.getVideo(videoId).orElseThrow().description());

                application.getBean(VideoRepository.class).deleteById(videoId);
                assertTrue(videos.getVideo(videoId).isEmpty());
                var jdbc = application.getBean(JdbcTemplate.class);
                for (String table : List.of("video_tags", "comments", "video_likes", "watch_history")) {
                    assertEquals(0L, jdbc.queryForObject("select count(*) from " + table, Long.class));
                }
                // Removing a video's associations must not remove shared tag values.
                assertEquals(2L, jdbc.queryForObject("select count(*) from tags", Long.class));
                users.deleteById(userId);
                assertTrue(users.findById(userId).isEmpty());
            }
        }
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
