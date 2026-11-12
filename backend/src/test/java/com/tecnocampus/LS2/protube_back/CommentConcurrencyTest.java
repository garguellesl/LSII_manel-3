package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.model.*;
import com.tecnocampus.LS2.protube_back.repositories.CommentRepository;
import com.tecnocampus.LS2.protube_back.services.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;

// Separate database: committed concurrent transactions must not pollute shared integration fixtures.
@SpringBootTest({"pro_tube.store.dir=.", "pro_tube.load_initial_data=false"})
@ActiveProfiles("test")
class CommentConcurrencyTest {
    static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("protube_comments_concurrency").withPassword(UUID.randomUUID().toString());
    static { DATABASE.start(); }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", DATABASE::getJdbcUrl);
        properties.add("spring.datasource.username", DATABASE::getUsername);
        properties.add("spring.datasource.password", DATABASE::getPassword);
    }

    @Autowired CommentService comments;
    @Autowired VideoService videos;
    @Autowired UserService users;
    @Autowired CommentRepository repository;
    @Autowired PlatformTransactionManager transactions;
    @Autowired JdbcTemplate jdbc;
    Long author;
    Long other;
    Long video;
    Long root;

    @BeforeEach
    void setUp() {
        author = account();
        other = account();
        video = videos.createVideo(new CreateVideoRequest("Concurrent discussion", "", UUID.randomUUID() + ".mp4",
                null, 0, author, List.of())).id();
        root = comments.addComment(video, new CommentRequest("root", null), author).id();
    }

    @Test
    void concurrentLikesAndUnlikesAreIdempotentAndDoNotAffectOtherUsers() throws Exception {
        race(() -> comments.setLike(root, author, true), () -> comments.setLike(root, author, true));
        assertEquals(1, comments.getComments(video, author).getFirst().likesCount());
        race(() -> comments.setLike(root, author, true), () -> comments.setLike(root, other, true));
        assertEquals(2, comments.getComments(video, author).getFirst().likesCount());
        race(() -> comments.setLike(root, author, false), () -> comments.setLike(root, author, false));
        var response = comments.getComments(video, other).getFirst();
        assertEquals(1, response.likesCount());
        assertTrue(response.likedByMe());
        race(() -> comments.setLike(root, other, false), () -> comments.setLike(root, other, false));
        assertEquals(0, comments.getComments(video, author).getFirst().likesCount());
    }

    @Test
    void committedDeletionRejectsEveryWriterAlreadyWaitingOnTheRowLock() throws Exception {
        for (String action : List.of("reply", "like", "unlike", "edit")) {
            Long parent = comments.addComment(video, new CommentRequest(action, null), author).id();
            comments.setLike(parent, other, true);
            CountDownLatch deletionFlushed = new CountDownLatch(1);
            CountDownLatch releaseDeletion = new CountDownLatch(1);
            try (var pool = Executors.newFixedThreadPool(2)) {
                Future<?> deletion = pool.submit(() -> new TransactionTemplate(transactions).executeWithoutResult(status -> {
                    comments.deleteComment(parent, author);
                    repository.flush();
                    deletionFlushed.countDown();
                    await(releaseDeletion);
                }));
                assertTrue(deletionFlushed.await(10, TimeUnit.SECONDS));
                Future<?> writer = pool.submit(() -> switch (action) {
                    case "reply" -> comments.addComment(video, new CommentRequest("blocked reply", parent), other);
                    case "like" -> comments.setLike(parent, other, true);
                    case "unlike" -> comments.setLike(parent, other, false);
                    default -> comments.updateComment(parent, new UpdateCommentRequest("blocked edit"), author);
                });
                try {
                    // Observe actual PostgreSQL blocking, not a timing assumption or an artificial sleep.
                    long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                    boolean blocked = false;
                    while (System.nanoTime() < deadline && !blocked) {
                        blocked = Boolean.TRUE.equals(jdbc.queryForObject("""
                                select exists(select 1 from pg_stat_activity
                                where datname = current_database() and cardinality(pg_blocking_pids(pid)) > 0)
                                """, Boolean.class));
                        Thread.yield();
                    }
                    assertTrue(blocked, action + " must wait on the deletion row lock");
                } finally {
                    releaseDeletion.countDown();
                }
                deletion.get(10, TimeUnit.SECONDS);
                var failure = assertThrows(ExecutionException.class, () -> writer.get(10, TimeUnit.SECONDS));
                assertInstanceOf(DeletedCommentException.class, failure.getCause());
            } finally {
                releaseDeletion.countDown();
            }
            assertEquals(1L, jdbc.queryForObject("select count(*) from comment_likes where comment_id = ?", Long.class, parent));
            assertEquals(0L, jdbc.queryForObject("select count(*) from comments where parent_id = ?", Long.class, parent));
        }
    }

    @Test
    void replyCommittedBeforeDeletionSurvivesAndTransactionsRollBackFully() {
        var reply = comments.addComment(video, new CommentRequest("retained", root), other);
        comments.deleteComment(root, author);
        assertEquals(reply.id(), comments.getComments(video, other).get(1).id());
        var template = new TransactionTemplate(transactions);
        assertThrows(IllegalStateException.class, () -> template.executeWithoutResult(status -> {
            comments.addComment(video, new CommentRequest("rolled back", reply.id()), author);
            comments.setLike(reply.id(), author, true);
            throw new IllegalStateException("simulate rollback");
        }));
        assertEquals(2, comments.getComments(video, author).size());
        assertEquals(0, comments.getComments(video, author).get(1).likesCount());
    }

    private void race(Supplier<?> first, Supplier<?> second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var tasks = List.of(first, second).stream().map(operation -> pool.submit(() -> {
                ready.countDown();
                await(start);
                return operation.get();
            })).toList();
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            for (var task : tasks) task.get(15, TimeUnit.SECONDS);
        } finally {
            start.countDown();
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(15, TimeUnit.SECONDS)) throw new IllegalStateException("Latch timed out");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private Long account() {
        String name = UUID.randomUUID().toString();
        return users.register(new RegisterRequest(name + "@example.test", name, "Test", "User", "password123")).id();
    }
}
