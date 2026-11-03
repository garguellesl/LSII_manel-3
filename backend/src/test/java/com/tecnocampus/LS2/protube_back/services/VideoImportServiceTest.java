package com.tecnocampus.LS2.protube_back.services;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
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
import org.slf4j.LoggerFactory;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.IntStream;

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
        verify(videoService).attachImportedTagsIfMissing("2.mp4", List.of());
        verify(videoService, never()).createVideo(any());
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

    private void stubLegacyOwner(UserAccount old) {
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.of(old));
        when(passwordEncoder.encode("demo-password")).thenReturn("new-hash");
        when(userAccountRepository.save(old)).thenReturn(old);
    }

    @Test
    void importsNormalizedTagsFromMetaTagsForANewVideo() throws Exception {
        Files.writeString(storeDirectory.resolve("4.json"), """
                {"title":"Tagged video","duration":10,"meta":{"description":"d","tags":["Java ","JAVA","PostgreSQL"]}}
                """);
        Files.writeString(storeDirectory.resolve("4.mp4"), "");
        Files.writeString(storeDirectory.resolve("4.webp"), "");
        stubLegacyOwner(owner("imported@protube.local", "imported-videos", 7));

        importer.importFromStore(storeDirectory);

        var request = ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(videoService).createVideo(request.capture());
        assertEquals(List.of("java", "postgresql"), request.getValue().tags());
    }

    @Test
    void discardsInvalidTagsWithSanitizedWarnLogWhileKeepingValidOnes() throws Exception {
        String controlCharacterTag = "tag" + (char) 7 + "name";
        String json = new ObjectMapper().writeValueAsString(Map.of(
                "title", "Mixed tags",
                "duration", 5,
                "meta", Map.of(
                        "description", "d",
                        "tags", List.of("rock", "", "what;s up", controlCharacterTag)
                )
        ));
        Files.writeString(storeDirectory.resolve("5.json"), json);
        Files.writeString(storeDirectory.resolve("5.mp4"), "");
        Files.writeString(storeDirectory.resolve("5.webp"), "");
        stubLegacyOwner(owner("imported@protube.local", "imported-videos", 7));

        var logger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VideoImportService.class);
        var appender = new ListAppender<ILoggingEvent>();
        appender.start();
        logger.addAppender(appender);
        try {
            importer.importFromStore(storeDirectory);
        } finally {
            logger.detachAppender(appender);
        }

        var request = ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(videoService).createVideo(request.capture());
        assertEquals(List.of("rock"), request.getValue().tags());

        List<String> messages = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
        assertTrue(messages.stream().anyMatch(m -> m.contains("5.json") && m.contains("what;s up")));
        assertTrue(messages.stream().anyMatch(m -> m.contains("5.json") && m.contains("\\u0007")));
        assertTrue(messages.stream().noneMatch(m -> m.indexOf((char) 7) >= 0));
    }

    @Test
    void keepsAllDistinctTagsWhenRawListHasCaseDuplicatesUpToTheLimit() throws Exception {
        List<String> rawTags = new ArrayList<>(
                IntStream.range(0, 40).mapToObj(i -> "tag" + i).toList());
        rawTags.add("TAG0");
        String json = new ObjectMapper().writeValueAsString(Map.of(
                "title", "Forty tags", "duration", 1,
                "meta", Map.of("description", "d", "tags", rawTags)
        ));
        Files.writeString(storeDirectory.resolve("7.json"), json);
        Files.writeString(storeDirectory.resolve("7.mp4"), "");
        Files.writeString(storeDirectory.resolve("7.webp"), "");
        stubLegacyOwner(owner("imported@protube.local", "imported-videos", 7));

        importer.importFromStore(storeDirectory);

        var request = ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(videoService).createVideo(request.capture());
        assertEquals(40, request.getValue().tags().size());
        assertEquals(IntStream.range(0, 40).mapToObj(i -> "tag" + i).toList(), request.getValue().tags());
    }

    @Test
    void capsAtFortyDistinctTagsAndWarnsAboutTheExcess() throws Exception {
        List<String> rawTags = IntStream.range(0, 41).mapToObj(i -> "tag" + i).toList();
        String json = new ObjectMapper().writeValueAsString(Map.of(
                "title", "Forty-one tags", "duration", 1,
                "meta", Map.of("description", "d", "tags", rawTags)
        ));
        Files.writeString(storeDirectory.resolve("8.json"), json);
        Files.writeString(storeDirectory.resolve("8.mp4"), "");
        Files.writeString(storeDirectory.resolve("8.webp"), "");
        stubLegacyOwner(owner("imported@protube.local", "imported-videos", 7));

        var logger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VideoImportService.class);
        var appender = new ListAppender<ILoggingEvent>();
        appender.start();
        logger.addAppender(appender);
        try {
            importer.importFromStore(storeDirectory);
        } finally {
            logger.detachAppender(appender);
        }

        var request = ArgumentCaptor.forClass(CreateVideoRequest.class);
        verify(videoService).createVideo(request.capture());
        assertEquals(IntStream.range(0, 40).mapToObj(i -> "tag" + i).toList(), request.getValue().tags());

        List<String> messages = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
        assertTrue(messages.stream().anyMatch(m -> m.contains("8.json") && m.contains("tag40") && m.contains("40 distinct tags")));
    }

    @Test
    void backfillsResolvedTagsForAnAlreadyImportedVideoWithoutCreatingANewOne() throws Exception {
        Files.writeString(storeDirectory.resolve("6.json"), """
                {"title":"Already imported","duration":3,"meta":{"description":"d","tags":["Live","live "]}}
                """);
        Files.writeString(storeDirectory.resolve("6.mp4"), "");
        Files.writeString(storeDirectory.resolve("6.webp"), "");
        var existing = owner("admin@protube.local", "admin", 8);
        when(userAccountRepository.findByEmailIgnoreCase("imported@protube.local")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase(existing.getEmail())).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("demo-password", "old-hash")).thenReturn(true);
        when(videoRepository.existsByMediaPath("6.mp4")).thenReturn(true);

        importer.importFromStore(storeDirectory);

        verify(videoService).attachImportedTagsIfMissing("6.mp4", List.of("live"));
        verify(videoService, never()).createVideo(any());
    }
}
