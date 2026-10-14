package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.LoginRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest({
        "pro_tube.store.dir=.",
        "pro_tube.load_initial_data=false"
})
@Transactional
class UserServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    UserAccountRepository userAccountRepository;

    @Test
    void registersUserWithBcryptPasswordHash() {
        var response = userService.register(new RegisterRequest(
                "user@example.com",
                "user",
                "User",
                "Example",
                "password123"
        ));

        var saved = userAccountRepository.findById(response.id()).orElseThrow();
        assertEquals("user@example.com", response.email());
        assertNotEquals("password123", saved.getPasswordHash());
        assertTrue(saved.getPasswordHash().startsWith("$2"));
    }

    @Test
    void rejectsDuplicateEmail() {
        userService.register(new RegisterRequest("dupe@example.com", "dupe", "Dupe", "One", "password123"));

        assertThrows(DuplicateResourceException.class, () -> userService.register(
                new RegisterRequest("dupe@example.com", "dupe-two", "Dupe", "Two", "password123")
        ));
    }

    @Test
    void loginReturnsUserForValidCredentials() {
        userService.register(new RegisterRequest("login@example.com", "login", "Log", "In", "password123"));

        var response = userService.login(new LoginRequest("login@example.com", "password123"));

        assertEquals("login", response.accountName());
    }

    @Test
    void loginRejectsInvalidPassword() {
        userService.register(new RegisterRequest("bad@example.com", "bad", "Bad", "Password", "password123"));

        assertThrows(InvalidCredentialsException.class,
                () -> userService.login(new LoginRequest("bad@example.com", "wrong-password")));
    }
}
