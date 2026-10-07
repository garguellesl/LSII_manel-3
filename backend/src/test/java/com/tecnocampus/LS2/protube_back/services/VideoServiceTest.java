package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VideoServiceTest {

    @Test
    void returnsOnlyCompleteVideoTriplesSortedById() throws Exception {
        Path store = Files.createTempDirectory("protube-videos");
        Files.writeString(store.resolve("2.json"), "{\"id\":2,\"title\":\"Second\"}");
        Files.writeString(store.resolve("2.mp4"), "");
        Files.writeString(store.resolve("2.webp"), "");
        Files.writeString(store.resolve("1.json"), "{\"id\":1,\"title\":\"First\"}");
        Files.writeString(store.resolve("1.mp4"), "");
        Files.writeString(store.resolve("1.webp"), "");
        Files.writeString(store.resolve("3.json"), "{\"id\":3,\"title\":\"Incomplete\"}");

        VideoService videoService = new VideoService(store.toString(), new ObjectMapper());

        assertEquals(
                List.of(
                        new VideoSummary(1, "First", "/media/1.webp", "/media/1.mp4"),
                        new VideoSummary(2, "Second", "/media/2.webp", "/media/2.mp4")
                ),
                videoService.getVideos()
        );
    }
}
