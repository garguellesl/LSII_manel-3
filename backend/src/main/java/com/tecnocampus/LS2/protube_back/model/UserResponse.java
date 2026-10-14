package com.tecnocampus.LS2.protube_back.model;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String accountName,
        String firstName,
        String lastName,
        LocalDateTime createdAt
) {
}
