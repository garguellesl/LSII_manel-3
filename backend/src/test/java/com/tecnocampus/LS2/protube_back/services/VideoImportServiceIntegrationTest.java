package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Transactional
// Within one test method this is the only call that creates a brand-new demo
// account, so the password only needs to satisfy DemoAdminSettings once.
@TestPropertySource(properties = "pro_tube.demo-admin.password=demo-password123")
class VideoImportServiceIntegrationTest extends PostgreSqlIntegrationTest {

    @Autowired
    VideoImportService videoImportService;

    @Autowired
    VideoService videoService;

    @Autowired
    JdbcTemplate jdbc;

    @TempDir
    Path storeDirectory;

    @Test
    void deletingAnImportedVideoPreventsItFromReappearingOnTheNextImportPassWhileOthersAreUnaffected() throws IOException {
        writeTriple("deleted-on-restart", "Deleted on restart");
        writeTriple("kept-on-restart", "Kept on restart");

        videoImportService.importFromStore(storeDirectory);
        assertEquals(1L, countVideosWithMediaPath("deleted-on-restart.mp4"));
        assertEquals(1L, countVideosWithMediaPath("kept-on-restart.mp4"));

        Long deletedId = jdbc.queryForObject(
                "select id from videos where media_path = ?", Long.class, "deleted-on-restart.mp4");
        Long ownerId = jdbc.queryForObject(
                "select owner_user_id from videos where media_path = ?", Long.class, "deleted-on-restart.mp4");
        videoService.deleteVideo(deletedId, ownerId);
        assertEquals(1L, jdbc.queryForObject(
                "select count(*) from deleted_media_paths where media_path = ?", Long.class, "deleted-on-restart.mp4"));

        // Simulate a restart: the importer scans the same read-only directory again.
        videoImportService.importFromStore(storeDirectory);

        assertEquals(0L, countVideosWithMediaPath("deleted-on-restart.mp4"));
        assertEquals(1L, countVideosWithMediaPath("kept-on-restart.mp4"));
    }

    private long countVideosWithMediaPath(String mediaPath) {
        return jdbc.queryForObject("select count(*) from videos where media_path = ?", Long.class, mediaPath);
    }

    private void writeTriple(String baseName, String title) throws IOException {
        Files.writeString(storeDirectory.resolve(baseName + ".json"), """
                {"title":"%s","duration":1,"meta":{"description":"d"}}
                """.formatted(title));
        Files.writeString(storeDirectory.resolve(baseName + ".mp4"), "");
        Files.writeString(storeDirectory.resolve(baseName + ".webp"), "");
    }
}
