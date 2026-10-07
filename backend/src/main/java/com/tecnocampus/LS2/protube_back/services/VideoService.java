package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;

@Service
public class VideoService {

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
        try (var files = Files.list(storeDirectory)) {
            return files
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .map(this::readVideo)
                    .filter(video -> video != null)
                    .sorted(Comparator.comparingInt(VideoSummary::id))
                    .toList();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read video store: " + storeDirectory, exception);
        }
    }

    private VideoSummary readVideo(Path metadataPath) {
        String fileName = metadataPath.getFileName().toString();
        String baseName = fileName.substring(0, fileName.length() - ".json".length());
        if (!Files.isRegularFile(storeDirectory.resolve(baseName + ".mp4"))
                || !Files.isRegularFile(storeDirectory.resolve(baseName + ".webp"))) {
            return null;
        }

        try {
            JsonNode metadata = objectMapper.readTree(metadataPath.toFile());
            return new VideoSummary(
                    metadata.path("id").asInt(),
                    metadata.path("title").asText("Untitled video"),
                    "/media/" + baseName + ".webp",
                    "/media/" + baseName + ".mp4"
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read video metadata: " + metadataPath, exception);
        }
    }
}
