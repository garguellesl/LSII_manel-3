package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.LoginRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.nio.charset.StandardCharsets;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings demo;

    public UserService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder,
                       com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings demo) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.demo = demo;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must contain at most 72 UTF-8 bytes");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String accountName = request.accountName().trim().toLowerCase(Locale.ROOT);
        if (email.equals(VideoImportService.IMPORT_USER_EMAIL)
                || accountName.equals(VideoImportService.IMPORT_USER_ACCOUNT)
                || email.equals(demo.email()) || accountName.equals(demo.accountName())) {
            throw new IllegalArgumentException("Email or account name is reserved");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Email is already registered");
        }
        if (userAccountRepository.existsByAccountNameIgnoreCase(accountName)) {
            throw new DuplicateResourceException("Account name is already registered");
        }

        UserAccount user = new UserAccount(
                email,
                accountName,
                request.firstName().trim(),
                request.lastName().trim(),
                passwordEncoder.encode(request.password())
        );
        try {
            return toResponse(userAccountRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateResourceException("Email or account name is already registered");
        }
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        if (user.getEmail().equalsIgnoreCase(VideoImportService.IMPORT_USER_EMAIL)
                || user.getAccountName().equalsIgnoreCase(VideoImportService.IMPORT_USER_ACCOUNT)
                || request.password().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        return toResponse(userAccountRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Session is no longer valid")));
    }

    public UserResponse toResponse(UserAccount user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getAccountName(),
                user.getFirstName(),
                user.getLastName(),
                user.getCreatedAt()
        );
    }
}
