package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class VideosControllerTest {

    @Mock
    VideoService videoService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new VideosController(videoService)).build();
    }

    @Test
    void getVideosReturnsVideoSummaries() throws Exception {
        when(videoService.getVideos()).thenReturn(List.of(
                new VideoSummary(1, "video 1", "/media/1.webp", "/media/1.mp4"),
                new VideoSummary(2, "video 2", "/media/2.webp", "/media/2.mp4")
        ));

        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("video 1"))
                .andExpect(jsonPath("$[1].videoUrl").value("/media/2.mp4"));
    }

    @Test
    void getVideosReturnsEmptyListWhenNoVideos() throws Exception {
        when(videoService.getVideos()).thenReturn(List.of());

        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getVideoReturnsDetailWhenFound() throws Exception {
        when(videoService.getVideo(7)).thenReturn(Optional.of(
                new VideoDetail(7, "Seventh", "Author", "A description", 79.5,
                        "/media/7.webp", "/media/7.mp4")));

        mockMvc.perform(get("/api/videos/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.title").value("Seventh"))
                .andExpect(jsonPath("$.user").value("Author"))
                .andExpect(jsonPath("$.description").value("A description"))
                .andExpect(jsonPath("$.duration").value(79.5))
                .andExpect(jsonPath("$.videoUrl").value("/media/7.mp4"));
    }

    @Test
    void getVideoReturnsNotFoundWhenMissing() throws Exception {
        when(videoService.getVideo(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/videos/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getVideoReturnsBadRequestWhenIdIsNotANumber() throws Exception {
        mockMvc.perform(get("/api/videos/abc"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(videoService);
    }
}
