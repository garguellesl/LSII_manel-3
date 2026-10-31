package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.repositories.TagRepository;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Dedicated, isolated Postgres container (not the shared one from
 * PostgreSqlIntegrationTest): this test is deliberately not @Transactional so
 * that two threads open independent, overlapping real transactions, which
 * would otherwise pollute catalog-size assertions in other test classes
 * sharing that container.
 */
@SpringBootTest({
        "pro_tube.store.dir=.",
        "pro_tube.load_initial_data=false"
})
@ActiveProfiles("test")
class TagConcurrencyTest {

    private static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("protube_tag_concurrency")
            .withPassword(UUID.randomUUID().toString());

    static {
        DATABASE.start();
    }

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DATABASE::getJdbcUrl);
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
    }

    @Autowired
    UserService userService;

    @Autowired
    VideoService videoService;

    @Autowired
    TagRepository tagRepository;

    @Test
    void concurrentCreationOfSameNewTagNeverFailsAndEndsWithOneTagRow() throws Exception {
        Long ownerAId = userService.register(new RegisterRequest(
                "concurrency-a@example.com", "concurrency-a", "First", "Last", "password123")).id();
        Long ownerBId = userService.register(new RegisterRequest(
                "concurrency-b@example.com", "concurrency-b", "First", "Last", "password123")).id();

        String sharedNewTag = "indie-" + UUID.randomUUID();

        CountDownLatch bothReady = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Callable<VideoDetail> taskA = () -> {
            bothReady.countDown();
            go.await();
            return videoService.createVideo(new CreateVideoRequest(
                    "Video A", "Description", "concurrency-a.mp4", null, 0, ownerAId, List.of(sharedNewTag)
            ));
        };
        Callable<VideoDetail> taskB = () -> {
            bothReady.countDown();
            go.await();
            return videoService.createVideo(new CreateVideoRequest(
                    "Video B", "Description", "concurrency-b.mp4", null, 0, ownerBId, List.of(sharedNewTag)
            ));
        };

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<VideoDetail> futureA = pool.submit(taskA);
            Future<VideoDetail> futureB = pool.submit(taskB);
            bothReady.await();
            go.countDown();

            VideoDetail resultA = futureA.get(30, TimeUnit.SECONDS);
            VideoDetail resultB = futureB.get(30, TimeUnit.SECONDS);

            String normalizedTag = sharedNewTag.toLowerCase(java.util.Locale.ROOT);
            assertEquals(List.of(normalizedTag), resultA.tags());
            assertEquals(List.of(normalizedTag), resultB.tags());

            long matchingTagRows = tagRepository.findAll().stream()
                    .filter(tag -> tag.getName().equalsIgnoreCase(sharedNewTag))
                    .count();
            assertEquals(1, matchingTagRows);
        } finally {
            pool.shutdown();
        }
    }
}
