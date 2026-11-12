package com.tecnocampus.LS2.protube_back;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.services.*;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class VideoUploadIntegrationTest extends PostgreSqlIntegrationTest {
    static final Path STORE;
    static { try { STORE = Files.createTempDirectory("protube-upload-test-").toRealPath(); Files.createDirectory(STORE.resolve("imports")); }
        catch (java.io.IOException exception) { throw new ExceptionInInitializerError(exception); } }
    @DynamicPropertySource static void store(DynamicPropertyRegistry registry) {
        registry.add("pro_tube.store.dir", STORE::toString);
        registry.add("pro_tube.import.dir", () -> STORE.resolve("imports").toString());
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserService users;
    @Autowired MediaStorageService storage;
    @Autowired VideoUploadService uploads;
    @Autowired JdbcTemplate jdbc;

    MockMultipartFile metadata(String title, String tags) {
        return new MockMultipartFile("metadata", "", "application/json",
                ("{\"title\":\"" + title + "\",\"description\":\"description\",\"category\":\"Education\",\"tags\":" + tags + ",\"ownerUserId\":999}").getBytes());
    }

    @Test void registeredSessionPublishesAndServesVideoWithoutThumbnailAndPreservesOwnerAndMetadata() throws Exception {
        String name = "upload-" + UUID.randomUUID();
        var registration = mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
                .content(mapper.writeValueAsBytes(Map.of("email", name + "@example.test", "accountName", name,
                        "firstName", "Upload", "lastName", "Test", "password", "password123"))))
                .andExpect(status().isCreated()).andReturn();
        long owner = mapper.readTree(registration.getResponse().getContentAsString()).path("id").asLong();
        MockHttpSession session = (MockHttpSession) registration.getRequest().getSession(false);
        var response = mvc.perform(multipart("/api/videos").file(metadata(" Uploaded ", "[]")).file(UploadFixtures.video()).session(session).with(csrf()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("Uploaded"))
                .andExpect(jsonPath("$.category").value("Education")).andExpect(jsonPath("$.source").value("UPLOAD"))
                .andExpect(jsonPath("$.thumbnailUrl").isEmpty()).andReturn();
        var video = mapper.readTree(response.getResponse().getContentAsString());
        long id = video.path("id").asLong();
        String url = video.path("videoUrl").asText();
        assertEquals(owner, jdbc.queryForObject("select owner_user_id from videos where id=?", Long.class, id));
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().bytes(UploadFixtures.mp4()));
        mvc.perform(get(url).header("Range", "bytes=0-7")).andExpect(status().isPartialContent())
                .andExpect(header().string("Content-Range", "bytes 0-7/" + UploadFixtures.mp4().length));
        mvc.perform(get("/api/videos/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Uploaded"));
        mvc.perform(get("/api/videos").param("q", "Uploaded")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        assertTrue(storage.pendingIds().isEmpty());
        mvc.perform(get("/upload")).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
        jdbc.update("delete from videos where id=?", id);
        jdbc.update("delete from app_users where id=?", owner);
    }

    @Test void validatesExistingTagsAndImagesAndDoesNotPublishFailures() throws Exception {
        String name = "upload-" + UUID.randomUUID();
        var owner = users.register(new RegisterRequest(name+"@example.test", name, "First", "Last", "password123"));
        long before = jdbc.queryForObject("select count(*) from videos", Long.class);
        jdbc.update("insert into tags(name) values ('upload-tag') on conflict do nothing");
        var success = mvc.perform(multipart("/api/videos").file(metadata("With thumbnail", "[\"upload-tag\"]"))
                        .file(UploadFixtures.video()).file(UploadFixtures.image("png")).with(user(owner.id().toString())).with(csrf()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.tags[0]").value("upload-tag")).andReturn();
        var saved = mapper.readTree(success.getResponse().getContentAsString());
        mvc.perform(get(saved.path("thumbnailUrl").asText())).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        for (MockMultipartFile image : List.of(new MockMultipartFile("thumbnail", "bad.png", "image/png", new byte[]{1,2}),
                new MockMultipartFile("thumbnail", "bad.jpg", "image/jpeg", UploadFixtures.image("png").getBytes()))) {
            mvc.perform(multipart("/api/videos").file(metadata("Invalid", "[]")).file(UploadFixtures.video()).file(image)
                    .with(user(owner.id().toString())).with(csrf())).andExpect(status().isUnsupportedMediaType());
            assertTrue(storage.pendingIds().isEmpty());
        }
        mvc.perform(multipart("/api/videos").file(metadata("Invalid", "[\"nonexistent-upload-tag\"]")).file(UploadFixtures.video())
                .with(user(owner.id().toString())).with(csrf())).andExpect(status().isBadRequest());
        mvc.perform(post("/api/videos").with(user(owner.id().toString())).with(csrf()).contentType("application/json")
                .content("{\"title\":\"Invalid\",\"description\":\"\",\"mediaPath\":\"missing.mp4\",\"durationSeconds\":0}"))
                .andExpect(status().isBadRequest());
        assertEquals(before + 1, jdbc.queryForObject("select count(*) from videos", Long.class));
        jdbc.update("delete from videos where id=?", saved.path("id").asLong());
        jdbc.update("delete from app_users where id=?", owner.id());
    }

    @Test void servesOriginalMediaAtLegacyUrlsFromReadOnlyImportSubdirectory() throws Exception {
        Path imports = Files.createDirectories(STORE.resolve("imports"));
        Files.write(imports.resolve("legacy.mp4"), UploadFixtures.mp4());
        mvc.perform(get("/media/legacy.mp4")).andExpect(status().isOk()).andExpect(content().bytes(UploadFixtures.mp4()));
        assertEquals(imports.resolve("legacy.mp4"), storage.existingFile("legacy.mp4"));
    }

    @Test void recoveryCleansOnlyUncommittedManagedDirectoriesAndBlocksPrivateFiles() throws Exception {
        Path imported = Files.writeString(STORE.resolve("imported.json"), "keep original");
        UUID staged = storage.begin();
        storage.write(staged, UploadFixtures.video(), false);
        mvc.perform(get("/media/uploads/.pending/" + staged + "/video.mp4")).andExpect(status().isNotFound());
        mvc.perform(get("/media/uploads/.pending/" + staged + ".manifest")).andExpect(status().isNotFound());
        UUID moved = storage.begin();
        storage.write(moved, UploadFixtures.video(), false);
        storage.publish(moved);
        uploads.run(null);
        assertFalse(Files.exists(STORE.resolve(storage.mediaPath(moved))));
        assertTrue(storage.pendingIds().isEmpty());
        assertEquals("keep original", Files.readString(imported));
    }
}
