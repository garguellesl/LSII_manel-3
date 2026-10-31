package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.services.DuplicateResourceException;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class RegistrationConcurrencyTest extends PostgreSqlIntegrationTest {
    private final UserService users;

    @Autowired
    RegistrationConcurrencyTest(UserService users) {
        this.users = users;
    }

    @Test
    void simultaneousRegistrationCreatesExactlyOneAccount() throws Exception {
        String name = "race-" + UUID.randomUUID();
        var request = new RegisterRequest(name + "@example.test", name, "First", "Last", "password123");
        var ready = new CountDownLatch(2);
        var start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<Boolean> register = () -> {
                ready.countDown();
                assertTrue(start.await(10, TimeUnit.SECONDS));
                try {
                    users.register(request);
                    return true;
                } catch (DuplicateResourceException expected) {
                    return false;
                }
            };
            var first = executor.submit(register);
            var second = executor.submit(register);
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            assertNotEquals(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
            assertNotNull(users.login(new com.tecnocampus.LS2.protube_back.model.LoginRequest(
                    request.email(), request.password())).id());
        } finally {
            start.countDown();
            executor.shutdownNow();
        }
    }
}
