package com.tecnocampus.LS2.protube_back.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.UUID;

@SpringBootTest({
        "pro_tube.store.dir=.",
        "pro_tube.load_initial_data=false"
})
@ActiveProfiles("test")
public abstract class PostgreSqlIntegrationTest {

    // One isolated database per test JVM. Testcontainers cleans it up on JVM exit.
    private static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("protube_test")
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
}
