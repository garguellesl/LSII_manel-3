package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class VideosControllerTest {

    @Mock
    VideoService videoService;

    MockMvc mockMvc;
    ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new VideosController(videoService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void getVideosReturnsVideoSummaries() throws Exception {
        when(videoService.getVideos()).thenReturn(List.of(
                new VideoSummary(1L, "video 1", "/media/1.webp", "/media/1.mp4", List.of(), 0, 0, 0),
                new VideoSummary(2L, "video 2", "/media/2.webp", "/media/2.mp4", List.of(), 1, 2, 3)
        ));

        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("video 1"))
                .andExpect(jsonPath("$[1].videoUrl").value("/media/2.mp4"))
                .andExpect(jsonPath("$[1].likesCount").value(1));
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
        when(videoService.getVideo(7L)).thenReturn(Optional.of(
                new VideoDetail(7L, "Seventh", "Author", "A description", 79.5,
                        "/media/7.webp", "/media/7.mp4", List.of("java"), 1, 2, 3)));

        mockMvc.perform(get("/api/videos/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.title").value("Seventh"))
                .andExpect(jsonPath("$.user").value("Author"))
                .andExpect(jsonPath("$.description").value("A description"))
                .andExpect(jsonPath("$.duration").value(79.5))
                .andExpect(jsonPath("$.videoUrl").value("/media/7.mp4"))
                .andExpect(jsonPath("$.tags[0]").value("java"));
    }

    @Test
    void getVideoReturnsNotFoundWhenMissing() throws Exception {
        when(videoService.getVideo(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/videos/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getVideoReturnsBadRequestWhenIdIsNotANumber() throws Exception {
        mockMvc.perform(get("/api/videos/abc"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(videoService);
    }

    @Test
    void createVideoReturnsCreatedVideo() throws Exception {
        when(videoService.createVideo(any())).thenReturn(new VideoDetail(
                10L, "Created", "owner", "desc", 1,
                null, "/media/created.mp4", List.of(), 0, 0, 0
        ));

        mockMvc.perform(post("/api/videos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Created",
                                "description", "desc",
                                "mediaPath", "created.mp4",
                                "durationSeconds", 1,
                                "ownerUserId", 5
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.videoUrl").value("/media/created.mp4"));
    }

    @Test
    void createVideoReturnsBadRequestForInvalidInput() throws Exception {
        mockMvc.perform(post("/api/videos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "",
                                "description", "",
                                "mediaPath", "created.mp4",
                                "durationSeconds", 1,
                                "ownerUserId", 5
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createVideoReturnsBadRequestWithTagFieldErrorWhenTagIsInvalid() throws Exception {
        when(videoService.createVideo(any())).thenThrow(
                new com.tecnocampus.LS2.protube_back.services.InvalidTagsException(
                        Map.of("tags[0]", "tag must not be blank")));

        mockMvc.perform(post("/api/videos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Created",
                                "description", "desc",
                                "mediaPath", "created.mp4",
                                "durationSeconds", 1,
                                "ownerUserId", 5,
                                "tags", List.of("")
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors['tags[0]']").value("tag must not be blank"));
    }

    @Test
    void updateVideoReturnsBadRequestWithTagFieldErrorWhenTagIsInvalid() throws Exception {
        when(videoService.updateVideo(eq(7L), any())).thenThrow(
                new com.tecnocampus.LS2.protube_back.services.InvalidTagsException(
                        Map.of("tags", "must not contain more than 40 distinct tags")));

        mockMvc.perform(patch("/api/videos/7")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "tags", List.of("a", "b")
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.tags").value("must not contain more than 40 distinct tags"));
    }

    @Test
    void updateVideoReturnsUpdatedMetadata() throws Exception {
        when(videoService.updateVideo(eq(7L), any())).thenReturn(new VideoDetail(
                7L, "Seventh", "Author", "New description", 79.5,
                "/media/7.webp", "/media/7.mp4", List.of("db"), 0, 0, 0
        ));

        mockMvc.perform(patch("/api/videos/7")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "description", "New description",
                                "tags", List.of("db")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("New description"))
                .andExpect(jsonPath("$.tags[0]").value("db"));
    }

    @Test
    void likeVideoReturnsLikeState() throws Exception {
        when(videoService.likeVideo(7L, 3L)).thenReturn(new com.tecnocampus.LS2.protube_back.model.LikeResponse(
                7L, 3L, true, 1
        ));

        mockMvc.perform(post("/api/videos/7/likes")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("userId", 3))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likesCount").value(1));
    }

    @Test
    void unlikeVideoReturnsLikeState() throws Exception {
        when(videoService.unlikeVideo(7L, 3L)).thenReturn(new com.tecnocampus.LS2.protube_back.model.LikeResponse(
                7L, 3L, false, 0
        ));

        mockMvc.perform(delete("/api/videos/7/likes").param("userId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false))
                .andExpect(jsonPath("$.likesCount").value(0));
    }
}
