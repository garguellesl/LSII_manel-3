package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings;
import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoImportServiceTest {
    @TempDir Path storeDirectory;
    @Mock VideoRepository videoRepository;
    @Mock UserAccountRepository userAccountRepository;
    @Mock VideoService videoService;
    @Mock PasswordEncoder passwordEncoder;
    VideoImportService importer;

    @BeforeEach
    void setUp() {
        importer = new VideoImportService(videoRepository, userAccountRepository, videoService, passwordEncoder,
                new ObjectMapper(), new DemoAdminSettings(new MockEnvironment()
                .withProperty("pro_tube.demo-admin.password", "demo-password")));
    }

    private UserAccount owner(String email, String name, long id) {
        var owner = new UserAccount(email, name, "Imported", "Videos", "old-hash");
        ReflectionTestUtils.setField(owner, "id", id);
        ReflectionTestUtils.setField(owner, "createdAt", LocalDateTime.of(2020, 1, 1, 0, 0));
        return owner;
    }

    @Test
    void convertsLegacyOwnerWithoutChangingIdOrVideoAssociations() throws Exception {
        Files.writeString(storeDirectory.resolve("1.json"), """
                {"title":"Imported title","duration":42.5,"meta":{"description":"Imported description"}}
                """);
        Files.writeString(storeDirectory.resolve("1.mp4"), "");
        Files.writeString(storeDirectory.resolve("1.webp"), "");
        var old = owner("imported@protube.local", "imported-videos", 7);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.of(old));
        when(passwordEncoder.encode("demo-password")).thenReturn("new-hash");
        when(userAccountRepository.save(old)).thenReturn(old);

        importer.importFromStore(storeDirectory);

        var request = ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(videoService).createVideo(request.capture());
        assertEquals(7L, request.getValue().ownerUserId());
        assertEquals("Imported title", request.getValue().title());
        assertEquals(42.5, request.getValue().durationSeconds());
        assertEquals("admin@protube.local", old.getEmail());
        assertEquals("admin", old.getAccountName());
        assertEquals("new-hash", old.getPasswordHash());
        assertEquals(LocalDateTime.of(2020, 1, 1, 0, 0), old.getCreatedAt());
    }

    @Test
    void createsDemoAccountWithEncodedConfiguredPasswordEvenForAnEmptyStore() {
        when(passwordEncoder.encode("demo-password")).thenReturn("encoded");
        when(userAccountRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        importer.importFromStore(storeDirectory);
        var saved = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(saved.capture());
        assertEquals("admin@protube.local", saved.getValue().getEmail());
        assertEquals("admin", saved.getValue().getAccountName());
        assertEquals("encoded", saved.getValue().getPasswordHash());
        verifyNoInteractions(videoService);
    }

    @Test
    void restartReusesDemoOwnerWithoutResettingPasswordOrDuplicatingVideos() throws Exception {
        Files.writeString(storeDirectory.resolve("2.json"), "{}");
        Files.writeString(storeDirectory.resolve("2.mp4"), "");
        Files.writeString(storeDirectory.resolve("2.webp"), "");
        var existing = owner("admin@protube.local", "admin", 8);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase(existing.getEmail())).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("demo-password", "old-hash")).thenReturn(true);
        when(videoRepository.existsByMediaPath("2.mp4")).thenReturn(true);
        importer.importFromStore(storeDirectory);
        verify(userAccountRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
        verifyNoInteractions(videoService);
        assertEquals("old-hash", existing.getPasswordHash());
    }

    @Test
    void refusesConflictingIdentityWithoutOverwritingEitherAccount() {
        var old = owner("imported@protube.local", "imported-videos", 7);
        var other = owner("admin@protube.local", "someone", 9);
        when(userAccountRepository.findByEmailIgnoreCase(old.getEmail())).thenReturn(Optional.of(old));
        when(userAccountRepository.findByEmailIgnoreCase(other.getEmail())).thenReturn(Optional.of(other));
        assertThrows(IllegalStateException.class, () -> importer.importFromStore(storeDirectory));
        assertEquals("old-hash", old.getPasswordHash());
        assertEquals("old-hash", other.getPasswordHash());
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void refusesAccountNameCollisionAndExistingPasswordMismatch() {
        when(userAccountRepository.findByAccountNameIgnoreCase("admin"))
                .thenReturn(Optional.of(owner("other@example.test", "admin", 9)));
        assertThrows(IllegalStateException.class, () -> importer.importFromStore(storeDirectory));
        reset(userAccountRepository);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase("admin@protube.local"))
                .thenReturn(Optional.of(owner("admin@protube.local", "admin", 8)));
        assertThrows(IllegalStateException.class, () -> importer.importFromStore(storeDirectory));
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void skipsMissingStoreAndRejectsMissingOrShortBootstrapPassword() {
        importer.importFromStore(storeDirectory.resolve("missing"));
        verifyNoInteractions(userAccountRepository);
        for (String password : new String[]{"", "short", "é".repeat(37)}) {
            var settings = new DemoAdminSettings(new MockEnvironment().withProperty("pro_tube.demo-admin.password", password));
            var noPassword = new VideoImportService(videoRepository, userAccountRepository, videoService,
                    passwordEncoder, new ObjectMapper(), settings);
            assertThrows(IllegalStateException.class, () -> noPassword.importFromStore(storeDirectory));
        }
    }

    @Test
    void canReuseExistingDemoWithoutAHostBootstrapPassword() {
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase("admin@protube.local"))
                .thenReturn(Optional.of(owner("admin@protube.local", "admin", 8)));
        var settings = new DemoAdminSettings(new MockEnvironment());
        new VideoImportService(videoRepository, userAccountRepository, videoService, passwordEncoder,
                new ObjectMapper(), settings).importFromStore(storeDirectory);
        verifyNoInteractions(passwordEncoder);
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void skipsIncompleteVideoTriplesWithoutCreatingMetadata() throws Exception {
        Files.writeString(storeDirectory.resolve("3.json"), "{}");
        var existing = owner("admin@protube.local", "admin", 8);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase(existing.getEmail())).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("demo-password", "old-hash")).thenReturn(true);
        importer.importFromStore(storeDirectory);
        verifyNoInteractions(videoService);
    }
}
