package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class VideoService {

    private static final String UNTITLED = "Untitled video";

    private final Path storeDirectory;
    private final ObjectMapper objectMapper;

    public VideoService(
            @Value("${pro_tube.store.dir}") String storeDirectory,
            ObjectMapper objectMapper
    ) {
        this.storeDirectory = Path.of(storeDirectory);
        this.objectMapper = objectMapper;
    }

    public List<VideoSummary> getVideos() {
        return readStoredVideos().stream()
                .map(video -> new VideoSummary(
                        video.id(),
                        video.metadata().path("title").asText(UNTITLED),
                        video.thumbnailUrl(),
                        video.videoUrl()))
                .sorted(Comparator.comparingInt(VideoSummary::id))
                .toList();
    }

    public Optional<VideoDetail> getVideo(int id) {
        return readStoredVideos().stream()
                .filter(video -> video.id() == id)
                .findFirst()
                .map(video -> new VideoDetail(
                        video.id(),
                        video.metadata().path("title").asText(UNTITLED),
                        video.metadata().path("user").asText(""),
                        video.metadata().path("meta").path("description").asText(""),
                        video.metadata().path("duration").asDouble(0),
                        video.thumbnailUrl(),
                        video.videoUrl()));
    }

    private List<StoredVideo> readStoredVideos() {
        try (var files = Files.list(storeDirectory)) {
            return files
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .map(this::readVideo)
                    .filter(Objects::nonNull)
                    .toList();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read video store: " + storeDirectory, exception);
        }
    }

    private StoredVideo readVideo(Path metadataPath) {
        String fileName = metadataPath.getFileName().toString();
        String baseName = fileName.substring(0, fileName.length() - ".json".length());
        if (!Files.isRegularFile(storeDirectory.resolve(baseName + ".mp4"))
                || !Files.isRegularFile(storeDirectory.resolve(baseName + ".webp"))) {
            return null;
        }

        try {
            JsonNode metadata = objectMapper.readTree(metadataPath.toFile());
            return new StoredVideo(
                    metadata.path("id").asInt(),
                    metadata,
                    "/media/" + baseName + ".webp",
                    "/media/" + baseName + ".mp4"
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read video metadata: " + metadataPath, exception);
        }
    }

    private record StoredVideo(int id, JsonNode metadata, String thumbnailUrl, String videoUrl) {
    }
}
