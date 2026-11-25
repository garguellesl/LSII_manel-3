package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
        @Email @NotBlank @Size(max = 255) String email,
        @NotBlank @Size(max = 100) String accountName,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(min = 8, max = 72) String password,
        @Pattern(regexp = "es|ca|en") String preferredLanguage
) {
    public RegisterRequest(String email, String accountName, String firstName, String lastName, String password) {
        this(email, accountName, firstName, lastName, password, null);
    }

    public RegisterRequest {
        email = email == null ? null : email.trim();
        accountName = accountName == null ? null : accountName.trim();
    }
}
