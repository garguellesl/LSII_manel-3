package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VideoServiceTest {

    @TempDir
    Path store;

    VideoService videoService;

    @BeforeEach
    void setUp() {
        videoService = new VideoService(store.toString(), new ObjectMapper());
    }

    @Test
    void returnsOnlyCompleteVideoTriplesSortedById() throws Exception {
        writeVideo("2", "{\"id\":2,\"title\":\"Second\"}");
        writeVideo("1", "{\"id\":1,\"title\":\"First\"}");
        Files.writeString(store.resolve("3.json"), "{\"id\":3,\"title\":\"Incomplete\"}");

        assertEquals(
                List.of(
                        new VideoSummary(1, "First", "/media/1.webp", "/media/1.mp4"),
                        new VideoSummary(2, "Second", "/media/2.webp", "/media/2.mp4")
                ),
                videoService.getVideos()
        );
    }

    @Test
    void returnsEmptyListWhenStoreHasNoVideos() {
        assertEquals(List.of(), videoService.getVideos());
    }

    @Test
    void usesDefaultTitleWhenMetadataHasNoTitle() throws Exception {
        writeVideo("4", "{\"id\":4}");

        assertEquals("Untitled video", videoService.getVideos().get(0).title());
    }

    @Test
    void getVideoReturnsDetailWithMetadata() throws Exception {
        writeVideo("7", """
                {"id":7,"title":"Seventh","user":"Author","duration":79.5,
                 "meta":{"description":"A description"}}
                """);

        assertEquals(
                Optional.of(new VideoDetail(7, "Seventh", "Author", "A description", 79.5,
                        "/media/7.webp", "/media/7.mp4")),
                videoService.getVideo(7)
        );
    }

    @Test
    void getVideoUsesDefaultsWhenOptionalMetadataIsMissing() throws Exception {
        writeVideo("8", "{\"id\":8}");

        assertEquals(
                Optional.of(new VideoDetail(8, "Untitled video", "", "", 0,
                        "/media/8.webp", "/media/8.mp4")),
                videoService.getVideo(8)
        );
    }

    @Test
    void getVideoReturnsEmptyWhenIdDoesNotExist() throws Exception {
        writeVideo("1", "{\"id\":1,\"title\":\"First\"}");

        assertTrue(videoService.getVideo(99).isEmpty());
    }

    @Test
    void getVideoReturnsEmptyWhenVideoFilesAreIncomplete() throws Exception {
        Files.writeString(store.resolve("3.json"), "{\"id\":3,\"title\":\"Incomplete\"}");
        Files.writeString(store.resolve("3.mp4"), "");

        assertTrue(videoService.getVideo(3).isEmpty());
    }

    @Test
    void throwsWhenStoreDirectoryDoesNotExist() {
        VideoService missingStore = new VideoService(store.resolve("missing").toString(), new ObjectMapper());

        assertThrows(IllegalStateException.class, missingStore::getVideos);
    }

    @Test
    void throwsWhenMetadataIsMalformed() throws Exception {
        writeVideo("5", "{not valid json");

        assertThrows(IllegalStateException.class, videoService::getVideos);
    }

    private void writeVideo(String baseName, String metadata) throws IOException {
        Files.writeString(store.resolve(baseName + ".json"), metadata);
        Files.writeString(store.resolve(baseName + ".mp4"), "");
        Files.writeString(store.resolve(baseName + ".webp"), "");
    }
}
