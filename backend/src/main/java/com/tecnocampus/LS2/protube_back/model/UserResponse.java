package com.tecnocampus.LS2.protube_back.model;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String accountName,
        String firstName,
        String lastName,
        LocalDateTime createdAt,
        String displayName,
        String description,
        String avatarUrl,
        String bannerUrl,
        String preferredLanguage
) {
    public UserResponse(Long id, String email, String accountName, String firstName, String lastName,
                        LocalDateTime createdAt, String displayName, String description, String avatarUrl,
                        String preferredLanguage) {
        this(id, email, accountName, firstName, lastName, createdAt, displayName, description, avatarUrl, null,
                preferredLanguage);
    }

    public UserResponse(Long id, String email, String accountName, String firstName, String lastName,
                        LocalDateTime createdAt, String displayName, String description, String avatarUrl) {
        this(id, email, accountName, firstName, lastName, createdAt, displayName, description, avatarUrl, null, null);
    }

    public UserResponse(Long id, String email, String accountName, String firstName, String lastName,
                        LocalDateTime createdAt) {
        this(id, email, accountName, firstName, lastName, createdAt, accountName, null, null, null, null);
    }
}
