package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.configuration.SecurityConfig;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.services.VideoUploadService;
import com.tecnocampus.LS2.protube_back.services.UploadException;
import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VideoUploadController.class)
@Import(SecurityConfig.class)
class VideoUploadControllerTest {
    @Autowired MockMvc mvc;
    @MockBean VideoUploadService uploads;
    MockMultipartFile metadata(String title) {
        return new MockMultipartFile("metadata", "", "application/json", ("{\"title\":\"" + title + "\",\"category\":\"Music\",\"ownerUserId\":999}").getBytes());
    }

    @Test void acceptsMultipartWithSessionActorAndReturnsLocationAndDto() throws Exception {
        when(uploads.upload(any(), any(), any(), eq(3L))).thenReturn(new VideoDetail(10L, "Title", "owner", "", 2, null,
                "/media/uploads/test/video.mp4", List.of(), 0, 0, 0, 0, "Music", "UPLOAD"));
        mvc.perform(multipart("/api/videos").file(metadata("Title")).file(UploadFixtures.video())
                        .with(user("3")).with(csrf()))
                .andExpect(status().isCreated()).andExpect(header().string("Location", "/api/videos/10"))
                .andExpect(jsonPath("$.category").value("Music")).andExpect(jsonPath("$.source").value("UPLOAD"))
                .andExpect(jsonPath("$.dislikesCount").value(0));
        verify(uploads).upload(any(), any(), isNull(), eq(3L));
    }

    @Test void rejectsGuestAndMissingCsrfWithoutCallingService() throws Exception {
        mvc.perform(multipart("/api/videos").file(metadata("Title")).file(UploadFixtures.video()).with(csrf()))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/videos").file(metadata("Title")).file(UploadFixtures.video()).with(user("3")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        verifyNoInteractions(uploads);
    }

    @Test void rejectsMissingPartsBlankTitleMalformedMetadataAndWrongContentType() throws Exception {
        mvc.perform(multipart("/api/videos").file(metadata(" ")).file(UploadFixtures.video()).with(user("3")).with(csrf()))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/videos").file(metadata("Title")).with(user("3")).with(csrf()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
        mvc.perform(multipart("/api/videos").file(new MockMultipartFile("metadata", "", "application/json", "{".getBytes()))
                        .file(UploadFixtures.video()).with(user("3")).with(csrf())).andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/videos").file(new MockMultipartFile("metadata", "", "text/plain", "x".getBytes()))
                        .file(UploadFixtures.video()).with(user("3")).with(csrf())).andExpect(status().isUnsupportedMediaType());
        verifyNoInteractions(uploads);
    }

    @Test void exposesPublicCategoryCatalogAndMapsUploadErrors() throws Exception {
        mvc.perform(get("/api/categories")).andExpect(status().isOk()).andExpect(jsonPath("$.categories[0]").value("Music"));
        for (int status : new int[]{400, 413, 415, 503}) {
            doThrow(new UploadException(status, "clear error")).when(uploads).upload(any(), any(), any(), any());
            mvc.perform(multipart("/api/videos").file(metadata("Title")).file(UploadFixtures.video()).with(user("3")).with(csrf()))
                    .andExpect(status().is(status)).andExpect(jsonPath("$.error").value("clear error"));
        }
        doThrow(new org.springframework.web.multipart.MaxUploadSizeExceededException(1)).when(uploads).upload(any(), any(), any(), any());
        mvc.perform(multipart("/api/videos").file(metadata("Title")).file(UploadFixtures.video()).with(user("3")).with(csrf()))
                .andExpect(status().isPayloadTooLarge());
        doThrow(new org.springframework.web.multipart.MultipartException("broken")).when(uploads).upload(any(), any(), any(), any());
        mvc.perform(multipart("/api/videos").file(metadata("Title")).file(UploadFixtures.video()).with(user("3")).with(csrf()))
                .andExpect(status().isBadRequest());
    }
}
