package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.configuration.SessionAuthentication;
import com.tecnocampus.LS2.protube_back.model.CsrfResponse;
import com.tecnocampus.LS2.protube_back.model.LoginRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.services.RegistrationSessionException;
import com.tecnocampus.LS2.protube_back.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final SessionAuthentication sessions;

    public AuthController(UserService userService, SessionAuthentication sessions) {
        this.userService = userService;
        this.sessions = sessions;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getToken(), token.getHeaderName());
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request,
                                                HttpServletRequest httpRequest, HttpServletResponse response) {
        UserResponse user = userService.register(request);
        try {
            sessions.start(user.id(), httpRequest, response);
        } catch (RuntimeException exception) {
            throw new RegistrationSessionException(exception);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletRequest httpRequest, HttpServletResponse response) {
        UserResponse user = userService.login(request);
        sessions.start(user.id(), httpRequest, response);
        return ResponseEntity.ok(user);
    }
}
