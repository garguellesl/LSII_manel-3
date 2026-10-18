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

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String accountName = request.accountName().trim().toLowerCase(Locale.ROOT);
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
        return toResponse(userAccountRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        return toResponse(user);
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
