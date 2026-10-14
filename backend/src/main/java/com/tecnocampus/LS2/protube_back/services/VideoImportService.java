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
    private static final String IMPORT_USER_EMAIL = "imported@protube.local";
    private static final String IMPORT_USER_ACCOUNT = "imported-videos";

    private final VideoRepository videoRepository;
    private final UserAccountRepository userAccountRepository;
    private final VideoService videoService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public VideoImportService(VideoRepository videoRepository, UserAccountRepository userAccountRepository,
                              VideoService videoService, PasswordEncoder passwordEncoder, ObjectMapper objectMapper) {
        this.videoRepository = videoRepository;
        this.userAccountRepository = userAccountRepository;
        this.videoService = videoService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void importFromStore(Path storeDirectory) {
        if (!Files.isDirectory(storeDirectory)) {
            LOG.warn("Skipping initial video import because store directory does not exist: {}", storeDirectory);
            return;
        }

        UserAccount owner = userAccountRepository.findByEmailIgnoreCase(IMPORT_USER_EMAIL)
                .orElseGet(() -> userAccountRepository.save(new UserAccount(
                        IMPORT_USER_EMAIL,
                        IMPORT_USER_ACCOUNT,
                        "Imported",
                        "Videos",
                        passwordEncoder.encode("imported-videos")
                )));

        try (var files = Files.list(storeDirectory)) {
            files.filter(path -> path.getFileName().toString().endsWith(".json"))
                    .forEach(path -> importMetadata(storeDirectory, path, owner));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to import videos from store: " + storeDirectory, exception);
        }
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
