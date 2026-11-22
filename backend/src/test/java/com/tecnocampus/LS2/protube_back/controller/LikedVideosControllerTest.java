package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.LikedVideosPage;
import com.tecnocampus.LS2.protube_back.services.LikedVideosService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LikedVideosControllerTest {
    private static final String PATH = "/api/users/me/liked-videos";

    @Mock LikedVideosService likedVideos;
    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new LikedVideosController(likedVideos))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }

    @Test
    void defaultsToOwnFirstPageAndDisablesCaching() throws Exception {
        when(likedVideos.getLikedVideos(3L, 0, 24)).thenReturn(new LikedVideosPage(
                List.of(new LikedVideosPage.Item(17L, "Liked", "/media/thumb.webp")), 0, 24, false, 1));

        mvc.perform(get(PATH).principal(() -> "3").param("userId", "9"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(24))
                .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.content[0].id").value(17))
                .andExpect(jsonPath("$.content[0].title").value("Liked"))
                .andExpect(jsonPath("$.content[0].thumbnailUrl").value("/media/thumb.webp"));
    }

    @ParameterizedTest
    @CsvSource({"-1,24", "0,0", "0,101", "2147483647,100", "bad,24"})
    void rejectsInvalidPagingBeforeCallingService(String page, String size) throws Exception {
        mvc.perform(get(PATH).principal(() -> "3").param("page", page).param("size", size))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(likedVideos);
    }
}
