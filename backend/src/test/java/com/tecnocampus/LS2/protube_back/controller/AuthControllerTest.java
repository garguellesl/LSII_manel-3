package com.tecnocampus.LS2.protube_back.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.services.InvalidCredentialsException;
import com.tecnocampus.LS2.protube_back.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    UserService userService;

    MockMvc mockMvc;
    ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(userService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void registerReturnsCreatedUser() throws Exception {
        when(userService.register(any())).thenReturn(new UserResponse(
                1L, "user@example.com", "user", "User", "Example", LocalDateTime.now()
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "user@example.com",
                                "accountName", "user",
                                "firstName", "User",
                                "lastName", "Example",
                                "password", "password123"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.accountName").value("user"));
    }

    @Test
    void registerReturnsBadRequestForInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "not-email",
                                "accountName", "user",
                                "firstName", "User",
                                "lastName", "Example",
                                "password", "password123"
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginReturnsUnauthorizedForInvalidCredentials() throws Exception {
        when(userService.login(any())).thenThrow(new InvalidCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "user@example.com",
                                "password", "wrong-password"
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }
}
