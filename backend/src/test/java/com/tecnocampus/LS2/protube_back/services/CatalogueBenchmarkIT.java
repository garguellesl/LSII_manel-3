package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.jdbc.core.JdbcTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

/** Opt in with -Dtest=CatalogueBenchmarkIT on both revisions. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"pro_tube.load_initial_data=false", "pro_tube.store.dir=."})
class CatalogueBenchmarkIT extends PostgreSqlIntegrationTest {
    private static final List<String> ROUTES = List.of(
            "/api/videos?page=0&size=24", "/api/videos?q=Benchmark&tag=tag-1&page=0&size=24",
            "/api/videos?page=1&size=24", "/api/videos/1");
    private static final int USERS = 10;
    @LocalServerPort int port;
    @Autowired VideoService videos;
    @Autowired EntityManagerFactory emf;
    @Autowired JdbcTemplate jdbc;

    private record Sample(int route, long millis, boolean valid) {}

    @Test
    @Sql("/benchmark/catalogue-537.sql")
    void measureWarmCatalogueSearchPaginationAndDetail() throws Exception {
        assertEquals(537, jdbc.queryForObject("select count(*) from videos", Integer.class));
        assertEquals(5370, jdbc.queryForObject("select count(*) from video_likes", Integer.class));
        assertEquals(2685, jdbc.queryForObject("select count(*) from comments", Integer.class));
        var stats = emf.unwrap(SessionFactory.class).getStatistics();
        boolean wasEnabled = stats.isStatisticsEnabled();
        stats.setStatisticsEnabled(true);
        try {
            for (int size : List.of(1, 6, 24)) {
                long statements = stats.getPrepareStatementCount();
                long start = System.nanoTime();
                var page = videos.getVideos("", 0, size);
                long elapsed = System.nanoTime() - start;
                assertEquals(size, page.content().size());
                System.out.printf("SERVICE size=%d ms=%.3f sql=%d%n", size, elapsed / 1_000_000.0,
                        stats.getPrepareStatementCount() - statements);
            }
        } finally {
            stats.setStatisticsEnabled(wasEnabled);
        }
        try (var client = HttpClient.newHttpClient(); var executor = Executors.newFixedThreadPool(USERS)) {
            List<HttpRequest> requests = ROUTES.stream().map(route -> HttpRequest.newBuilder(
                    URI.create("http://127.0.0.1:" + port + route)).timeout(Duration.ofSeconds(45)).GET().build()).toList();
            List<byte[]> reference = new ArrayList<>();
            for (int i = 0; i < requests.size(); i++) {
                var request = requests.get(i);
                var response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
                assertEquals(200, response.statusCode());
                reference.add(response.body());
                System.out.printf("REFERENCE %s sha256=%s%n", ROUTES.get(i),
                        HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(response.body())));
            }
            // One concurrent warm-up followed by three measured rounds against the same fixture.
            for (int round = 0; round <= 3; round++) {
                long end = System.nanoTime() + Duration.ofSeconds(round == 0 ? 30 : 300).toNanos();
                List<Future<List<Sample>>> workers = new ArrayList<>();
                for (int user = 0; user < USERS; user++) {
                    int offset = user;
                    workers.add(executor.submit(() -> {
                        List<Sample> samples = new ArrayList<>();
                        int turn = offset;
                        while (System.nanoTime() < end) {
                            int route = turn++ % requests.size();
                            long start = System.nanoTime();
                            boolean valid;
                            try {
                                var response = client.send(requests.get(route), HttpResponse.BodyHandlers.ofByteArray());
                                valid = response.statusCode() == 200 && Arrays.equals(reference.get(route), response.body());
                            } catch (java.io.IOException failure) {
                                valid = false;
                            }
                            samples.add(new Sample(route, Duration.ofNanos(System.nanoTime() - start).toMillis(), valid));
                        }
                        return samples;
                    }));
                }
                List<Sample> samples = new ArrayList<>();
                for (var worker : workers) {
                    samples.addAll(worker.get());
                }
                for (int route = 0; route < requests.size(); route++) {
                    int index = route;
                    var calls = samples.stream().filter(s -> s.route() == index).toList();
                    var times = calls.stream().filter(Sample::valid).map(Sample::millis).sorted().toList();
                    assertFalse(times.isEmpty(), ROUTES.get(index));
                    System.out.printf("BENCH round=%d route=%s n=%d errors=%d p50_ms=%d p95_ms=%d%n",
                            round, ROUTES.get(index), calls.size(), calls.size() - times.size(),
                            times.get((times.size() - 1) / 2), times.get((int) Math.ceil(times.size() * .95) - 1));
                }
                assertTrue(samples.stream().allMatch(Sample::valid), "HTTP error or changed response during round " + round);
            }
        }
    }
}
