package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings;
import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.UpdateProfileRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// Real storage and image validation on a temporary store; only persistence is mocked.
class UserProfileServiceTest {
    @TempDir Path store;
    UserAccountRepository repository = mock(UserAccountRepository.class);
    UserAccount user = new UserAccount("ada@example.test", "ada", "Ada", "Lovelace", "hash");
    UserService service;

    @BeforeEach
    void setUp() {
        var environment = new MockEnvironment().withProperty("pro_tube.store.dir", store.toString());
        service = new UserService(repository, mock(PasswordEncoder.class), new DemoAdminSettings(new MockEnvironment()),
                new MediaStorageService(environment), new MediaFileValidator());
        when(repository.findById(1L)).thenReturn(Optional.of(user));
    }

    @Test
    void savesTrimmedTextKeepsOmittedFieldsAndFallsBackToTheAccountName() {
        var saved = service.updateProfile(1L, new UpdateProfileRequest("  Ada L.  ", " Matemática ", null), null);
        assertEquals("Ada L.", saved.displayName());
        assertEquals("Matemática", saved.description());
        assertNull(saved.avatarUrl());
        assertEquals("ada", saved.accountName());
        assertEquals("ada@example.test", saved.email());

        var partial = service.updateProfile(1L, new UpdateProfileRequest(null, "Nueva", null), null);
        assertEquals("Ada L.", partial.displayName());
        assertEquals("Nueva", partial.description());

        var cleared = service.updateProfile(1L, new UpdateProfileRequest(" ", "", null), null);
        assertEquals("ada", cleared.displayName());
        assertNull(cleared.description());
        assertNull(user.getDisplayName());
    }

    @Test
    void publishesAvatarUnderGeneratedNameReplacesThePreviousFileAndRemovesItOnRequest() throws Exception {
        var first = service.updateProfile(1L, new UpdateProfileRequest(null, null, null), avatar("../../me.png", "png"));
        assertTrue(first.avatarUrl().matches("/media/uploads/avatars/[0-9a-f-]{36}\\.png"));
        Path firstFile = store.resolve(user.getAvatarPath());
        assertTrue(Files.isRegularFile(firstFile));

        var second = service.updateProfile(1L, new UpdateProfileRequest(null, null, true), avatar("me.jpeg", "jpg"));
        assertTrue(second.avatarUrl().endsWith(".jpg"));
        assertFalse(Files.exists(firstFile));
        Path secondFile = store.resolve(user.getAvatarPath());
        assertTrue(Files.isRegularFile(secondFile));

        var removed = service.updateProfile(1L, new UpdateProfileRequest(null, null, true), null);
        assertNull(removed.avatarUrl());
        assertFalse(Files.exists(secondFile));
        assertEquals(List.of(), pendingFiles());
    }

    @Test
    void rejectedAvatarsKeepThePreviousProfileAndLeaveNoStagedFiles() throws Exception {
        service.updateProfile(1L, new UpdateProfileRequest("Ada", "Bio", null), avatar("me.png", "png"));
        String previous = user.getAvatarPath();

        var oversized = new MockMultipartFile("avatar", "big.png", "image/png",
                new byte[(int) MediaFileValidator.AVATAR_LIMIT + 1]);
        var wrongType = new MockMultipartFile("avatar", "me.gif", "image/gif", new byte[]{1});
        var notAnImage = new MockMultipartFile("avatar", "me.png", "image/png", "not an image".getBytes());
        var mislabelled = new MockMultipartFile("avatar", "me.png", "image/png", UploadFixtures.image("jpg").getBytes());
        assertEquals(413, status(oversized));
        assertEquals(415, status(wrongType));
        assertEquals(415, status(notAnImage));
        assertEquals(415, status(mislabelled));

        assertEquals("Ada", user.getDisplayName());
        assertEquals("Bio", user.getDescription());
        assertEquals(previous, user.getAvatarPath());
        assertTrue(Files.isRegularFile(store.resolve(previous)));
        assertEquals(List.of(), pendingFiles());
        try (var avatars = Files.list(store.resolve("uploads/avatars"))) {
            assertEquals(1, avatars.count());
        }
    }

    @Test
    void insideATransactionThePreviousAvatarSurvivesRollbackAndIsRemovedOnlyAfterCommit() throws Exception {
        service.updateProfile(1L, new UpdateProfileRequest(null, null, null), avatar("me.png", "png"));
        Path original = store.resolve(user.getAvatarPath());

        Path rolledBack = replaceAvatarAndComplete(
                org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK);
        assertTrue(Files.isRegularFile(original));
        assertFalse(Files.exists(rolledBack));

        Path committed = replaceAvatarAndComplete(
                org.springframework.transaction.support.TransactionSynchronization.STATUS_COMMITTED);
        assertTrue(Files.isRegularFile(committed));
    }

    // Runs one avatar replacement with transaction synchronization active and finishes it with the given status.
    private Path replaceAvatarAndComplete(int status) throws IOException {
        String before = user.getAvatarPath();
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        try {
            service.updateProfile(1L, new UpdateProfileRequest(null, null, null), avatar("new.png", "png"));
            Path published = store.resolve(user.getAvatarPath());
            // Nothing is deleted while the transaction is still open.
            assertTrue(Files.isRegularFile(store.resolve(before)));
            assertTrue(Files.isRegularFile(published));
            org.springframework.transaction.support.TransactionSynchronizationManager.getSynchronizations()
                    .forEach(synchronization -> synchronization.afterCompletion(status));
            if (status == org.springframework.transaction.support.TransactionSynchronization.STATUS_COMMITTED) {
                assertFalse(Files.exists(store.resolve(before)));
            } else {
                // A real rollback restores the entity; mirror it for the next step of the test.
                user.changeAvatar(before);
            }
            return published;
        } finally {
            org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void acceptsAnAvatarOfExactlyTwoMebibytes() throws Exception {
        byte[] image = UploadFixtures.image("png").getBytes();
        // Trailing bytes after the PNG end marker are ignored by the decoder.
        byte[] padded = java.util.Arrays.copyOf(image, (int) MediaFileValidator.AVATAR_LIMIT);
        var saved = service.updateProfile(1L, new UpdateProfileRequest(null, null, null),
                new MockMultipartFile("avatar", "me.png", "image/png", padded));
        assertEquals(MediaFileValidator.AVATAR_LIMIT, Files.size(store.resolve(user.getAvatarPath())));
        assertNotNull(saved.avatarUrl());
    }

    @Test
    void unknownSessionAccountIsRejectedWithoutWritingFiles() throws Exception {
        when(repository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(InvalidCredentialsException.class,
                () -> service.updateProfile(9L, new UpdateProfileRequest("x", null, null), avatar("me.png", "png")));
        assertFalse(Files.exists(store.resolve("uploads")));
    }

    private int status(MockMultipartFile avatar) {
        return assertThrows(UploadException.class,
                () -> service.updateProfile(1L, new UpdateProfileRequest("Changed", "Changed", null), avatar)).getStatus();
    }

    private MockMultipartFile avatar(String name, String format) throws IOException {
        return new MockMultipartFile("avatar", name, format.equals("png") ? "image/png" : "image/jpeg",
                UploadFixtures.image(format).getBytes());
    }

    private List<String> pendingFiles() throws IOException {
        Path pending = store.resolve("uploads/.pending");
        if (!Files.isDirectory(pending)) return List.of();
        try (var files = Files.list(pending)) {
            return files.map(path -> path.getFileName().toString()).toList();
        }
    }
}
