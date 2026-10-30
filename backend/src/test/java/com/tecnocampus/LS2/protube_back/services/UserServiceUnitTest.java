package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceUnitTest {
    @Test
    void concurrentUniqueConstraintViolationBecomesConflict() {
        var repository = mock(UserAccountRepository.class);
        var encoder = mock(PasswordEncoder.class);
        when(encoder.encode(any())).thenReturn("encoded");
        when(repository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("unique violation"));
        var service = new UserService(repository, encoder, new com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings(new org.springframework.mock.env.MockEnvironment()));
        assertThrows(DuplicateResourceException.class, () -> service.register(
                new RegisterRequest("race@example.test", "race", "First", "Last", "password123")));
    }

    @Test
    void reservedImportIdentityCannotBeRegisteredOrUsedForAuthentication() {
        var repository = mock(UserAccountRepository.class);
        var encoder = mock(PasswordEncoder.class);
        var service = new UserService(repository, encoder, new com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings(new org.springframework.mock.env.MockEnvironment()));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest(
                VideoImportService.IMPORT_USER_EMAIL, "ordinary", "First", "Last", "password123")));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest(
                "ordinary@example.test", VideoImportService.IMPORT_USER_ACCOUNT, "First", "Last", "password123")));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest(
                "admin@protube.local", "ordinary", "First", "Last", "password123")));
        assertThrows(IllegalArgumentException.class, () -> service.register(new RegisterRequest(
                "ordinary@example.test", "admin", "First", "Last", "password123")));
        var internal = new com.tecnocampus.LS2.protube_back.entities.UserAccount(
                VideoImportService.IMPORT_USER_EMAIL, VideoImportService.IMPORT_USER_ACCOUNT,
                "Imported", "Videos", "legacy-hash");
        when(repository.findByEmailIgnoreCase(internal.getEmail())).thenReturn(java.util.Optional.of(internal));
        assertThrows(InvalidCredentialsException.class, () -> service.login(
                new com.tecnocampus.LS2.protube_back.model.LoginRequest(internal.getEmail(), "password123")));
        verifyNoInteractions(encoder);
        verify(repository, never()).saveAndFlush(any());
    }
}
