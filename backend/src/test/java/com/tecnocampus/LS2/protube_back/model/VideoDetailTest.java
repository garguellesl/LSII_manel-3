package com.tecnocampus.LS2.protube_back.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class VideoDetailTest {
    @Test
    void legacyElevenArgumentConstructorKeepsCountersAndDefaultsNewFields() {
        VideoDetail detail = new VideoDetail(8L, "Title", "owner", "Description", 12,
                null, "/media/video.mp4", List.of("tag"), 2, 4, 6);

        assertEquals(2, detail.likesCount());
        assertEquals(4, detail.commentsCount());
        assertEquals(6, detail.viewsCount());
        assertEquals(0, detail.dislikesCount());
        assertNull(detail.category());
        assertEquals("LEGACY", detail.source());
        assertEquals(List.of("tag"), detail.tags());
    }

    @Test
    void canonicalConstructorAndJsonPreserveEveryCombinedField() {
        VideoDetail detail = new VideoDetail(8L, "Title", "owner", "Description", 12,
                null, "/media/video.mp4", List.of(), 2, 4, 6, 1, "Gaming", "UPLOAD");
        var json = new ObjectMapper().valueToTree(detail);

        assertEquals(2, json.path("likesCount").asLong());
        assertEquals(4, json.path("commentsCount").asLong());
        assertEquals(6, json.path("viewsCount").asLong());
        assertEquals(1, json.path("dislikesCount").asLong());
        assertEquals("Gaming", json.path("category").asText());
        assertEquals("UPLOAD", json.path("source").asText());
    }
}
