package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Service
public class VideoImportService {

    private static final Logger LOG = LoggerFactory.getLogger(VideoImportService.class);
    static final String IMPORT_USER_EMAIL = "imported@protube.local";
    static final String IMPORT_USER_ACCOUNT = "imported-videos";

    private final VideoRepository videoRepository;
    private final UserAccountRepository userAccountRepository;
    private final VideoService videoService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings demo;

    public VideoImportService(VideoRepository videoRepository, UserAccountRepository userAccountRepository,
                              VideoService videoService, PasswordEncoder passwordEncoder, ObjectMapper objectMapper,
                              com.tecnocampus.LS2.protube_back.configuration.DemoAdminSettings demo) {
        this.videoRepository = videoRepository;
        this.userAccountRepository = userAccountRepository;
        this.videoService = videoService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.demo = demo;
    }

    @Transactional
    public void importFromStore(Path storeDirectory) {
        if (!Files.isDirectory(storeDirectory)) {
            LOG.warn("Skipping initial video import because store directory does not exist: {}", storeDirectory);
            return;
        }

        UserAccount owner = demoOwner();

        try (var files = Files.list(storeDirectory)) {
            files.filter(path -> path.getFileName().toString().endsWith(".json"))
                    .forEach(path -> importMetadata(storeDirectory, path, owner));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to import videos from store: " + storeDirectory, exception);
        }
    }

    private UserAccount demoOwner() {
        var legacy = userAccountRepository.findByEmailIgnoreCase(IMPORT_USER_EMAIL);
        var configured = userAccountRepository.findByEmailIgnoreCase(demo.email());
        UserAccount owner = legacy.orElseGet(() -> configured.orElse(null));
        if (legacy.isPresent() && configured.isPresent()
                && !java.util.Objects.equals(legacy.get().getId(), configured.get().getId())) {
            throw new IllegalStateException("Demo email belongs to a different account; choose another demo identity");
        }
        var named = userAccountRepository.findByAccountNameIgnoreCase(demo.accountName());
        if (named.isPresent() && (owner == null || !java.util.Objects.equals(named.get().getId(), owner.getId()))) {
            throw new IllegalStateException("Demo account name belongs to a different account");
        }
        if (legacy.isPresent()) {
            if (!IMPORT_USER_ACCOUNT.equalsIgnoreCase(owner.getAccountName())) {
                throw new IllegalStateException("Legacy importer email belongs to an unexpected account");
            }
            owner.configureDemoIdentity(demo.email(), demo.accountName(), passwordEncoder.encode(demo.password()));
            return userAccountRepository.save(owner);
        }
        if (configured.isPresent()) {
            if (!owner.getAccountName().equals(demo.accountName())
                    || (demo.hasPassword() && !passwordEncoder.matches(demo.password(), owner.getPasswordHash()))) {
                throw new IllegalStateException("Existing demo identity or password differs; existing data was not changed");
            }
            return owner;
        }
        return userAccountRepository.save(new UserAccount(demo.email(), demo.accountName(), "Demo", "Admin",
                passwordEncoder.encode(demo.password())));
    }

    private void importMetadata(Path storeDirectory, Path metadataPath, UserAccount owner) {
        String fileName = metadataPath.getFileName().toString();
        String baseName = fileName.substring(0, fileName.length() - ".json".length());
        String mediaPath = baseName + ".mp4";
        String thumbnailPath = baseName + ".webp";
        if (!Files.isRegularFile(storeDirectory.resolve(mediaPath))
                || !Files.isRegularFile(storeDirectory.resolve(thumbnailPath))
                || videoRepository.existsByMediaPath(mediaPath)) {
            return;
        }

        try {
            JsonNode metadata = objectMapper.readTree(metadataPath.toFile());
            String description = metadata.path("meta").path("description").asText("");
            videoService.createVideo(new CreateVideoRequest(
                    metadata.path("title").asText("Untitled video"),
                    description,
                    mediaPath,
                    thumbnailPath,
                    metadata.path("duration").asDouble(0),
                    owner.getId(),
                    List.of()
            ));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read video metadata: " + metadataPath, exception);
        }
    }
}
