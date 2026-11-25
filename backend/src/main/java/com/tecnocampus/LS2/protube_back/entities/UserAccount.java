package com.tecnocampus.LS2.protube_back.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "account_name", nullable = false, unique = true)
    private String accountName;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "avatar_path", length = 500)
    private String avatarPath;

    protected UserAccount() {
    }

    @Column(name = "preferred_language", length = 2)
    private String preferredLanguage;

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        if (preferredLanguage != null && !java.util.Set.of("es", "ca", "en").contains(preferredLanguage)) {
            throw new IllegalArgumentException("Unsupported preferred language");
        }
        this.preferredLanguage = preferredLanguage;
    }

    public UserAccount(String email, String accountName, String firstName, String lastName, String passwordHash) {
        this.email = email;
        this.accountName = accountName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.passwordHash = passwordHash;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public void configureDemoIdentity(String email, String accountName, String passwordHash) {
        this.email = email;
        this.accountName = accountName;
        this.passwordHash = passwordHash;
        this.firstName = "Demo";
        this.lastName = "Admin";
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getAccountName() {
        return accountName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void updateProfile(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public void changeAvatar(String avatarPath) {
        this.avatarPath = avatarPath;
    }

    public String getDisplayName() {
        return displayName;
    }

    // Name shown wherever the account is represented publicly.
    public String getPublicName() {
        return displayName == null || displayName.isBlank() ? accountName : displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getAvatarPath() {
        return avatarPath;
    }
}
