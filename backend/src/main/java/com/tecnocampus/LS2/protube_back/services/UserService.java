package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.LoginRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tecnocampus.LS2.protube_back.model.PublicAuthor;
import com.tecnocampus.LS2.protube_back.model.UpdateProfileRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Locale;
import java.nio.charset.StandardCharsets;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private static final Logger LOG = LoggerFactory.getLogger(UserService.class);

    private final com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings demo;
    private final MediaStorageService storage;
    private final MediaFileValidator validator;

    public UserService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder,
                       com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings demo,
                       MediaStorageService storage, MediaFileValidator validator) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.demo = demo;
        this.storage = storage;
        this.validator = validator;
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

    /**
     * Updates the caller's own profile. The stored avatar reference only changes once the new
     * image is valid and published; the previous file is removed after commit, and the new one
     * is removed if the transaction rolls back, so a failure keeps the previous profile intact.
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request, MultipartFile avatar) {
        boolean replaceAvatar = avatar != null && !avatar.isEmpty();
        if (replaceAvatar) validator.validateAvatar(avatar);
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Session is no longer valid"));
        // Decode and publish the image before touching the entity: a rejected avatar changes nothing.
        String published = replaceAvatar ? storeAvatar(avatar) : null;
        user.updateProfile(
                request.displayName() == null ? user.getDisplayName() : blankToNull(request.displayName()),
                request.description() == null ? user.getDescription() : blankToNull(request.description()));

        String previous = user.getAvatarPath();
        if (replaceAvatar) {
            user.changeAvatar(published);
            afterTransaction(() -> storage.deleteAvatar(previous), () -> storage.deleteAvatar(published));
        } else if (Boolean.TRUE.equals(request.removeAvatar()) && previous != null) {
            user.changeAvatar(null);
            afterTransaction(() -> storage.deleteAvatar(previous), () -> { });
        }
        return toResponse(user);
    }

    private String storeAvatar(MultipartFile avatar) {
        Path staged = null;
        try {
            staged = storage.stageAvatar(avatar);
            String extension = validator.imageExtension(staged);
            String expectedMime = extension.equals("png") ? "image/png" : "image/jpeg";
            if (!expectedMime.equals(avatar.getContentType())) {
                throw new UploadException(415, "Avatar content does not match its format");
            }
            return storage.publishAvatar(staged, extension);
        } catch (IOException | RuntimeException exception) {
            if (staged != null) {
                try {
                    storage.discardStagedAvatar(staged);
                } catch (IOException cleanup) {
                    LOG.warn("Could not remove a staged avatar", cleanup);
                }
            }
            if (exception instanceof UploadException upload) throw upload;
            throw new UploadException("Could not save the avatar. Please try again.", exception);
        }
    }

    private void afterTransaction(FileCleanup onCommit, FileCleanup onRollback) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            cleanUp(onCommit);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                cleanUp(status == STATUS_COMMITTED ? onCommit : onRollback);
            }
        });
    }

    private void cleanUp(FileCleanup cleanup) {
        try {
            cleanup.run();
        } catch (IOException | RuntimeException exception) {
            // The profile is already consistent; an orphaned image must not fail the request.
            LOG.warn("Could not remove an unused avatar file", exception);
        }
    }

    private String blankToNull(String value) {
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @FunctionalInterface
    private interface FileCleanup {
        void run() throws IOException;
    }

    /** Replaces the caller's profile background. The previous file is removed only after commit. */
    @Transactional
    public UserResponse updateBanner(Long userId, MultipartFile banner) {
        validator.validateBanner(banner);
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Session is no longer valid"));
        String published = storeBanner(banner);
        String previous = user.getBannerPath();
        user.changeBanner(published);
        afterTransaction(() -> storage.deleteBanner(previous), () -> storage.deleteBanner(published));
        return toResponse(user);
    }

    @Transactional
    public UserResponse removeBanner(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Session is no longer valid"));
        String previous = user.getBannerPath();
        if (previous != null) {
            user.changeBanner(null);
            afterTransaction(() -> storage.deleteBanner(previous), () -> { });
        }
        return toResponse(user);
    }

    private String storeBanner(MultipartFile banner) {
        Path staged = null;
        try {
            staged = storage.stageBanner(banner);
            String extension = validator.imageExtension(staged);
            String expectedMime = extension.equals("png") ? "image/png" : "image/jpeg";
            if (!expectedMime.equals(banner.getContentType())) {
                throw new UploadException(415, "Banner content does not match its format");
            }
            return storage.publishBanner(staged, extension);
        } catch (IOException | RuntimeException exception) {
            if (staged != null) {
                try {
                    storage.discardStagedBanner(staged);
                } catch (IOException cleanup) {
                    LOG.warn("Could not remove a staged banner", cleanup);
                }
            }
            if (exception instanceof UploadException upload) throw upload;
            throw new UploadException("Could not save the banner. Please try again.", exception);
        }
    }

    private static String bannerUrl(String bannerPath) {
        return bannerPath == null || bannerPath.isBlank() ? null : "/media/" + bannerPath;
    }

    public UserResponse toResponse(UserAccount user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getAccountName(),
                user.getFirstName(),
                user.getLastName(),
                user.getCreatedAt(),
                user.getPublicName(),
                user.getDescription(),
                PublicAuthor.of(user.getId(), user.getPublicName(), user.getAvatarPath()).avatarUrl(),
                bannerUrl(user.getBannerPath())
        );
    }
}
