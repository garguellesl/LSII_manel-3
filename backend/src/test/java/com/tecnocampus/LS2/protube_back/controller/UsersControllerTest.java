package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.UpdateProfileRequest;
import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.model.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.services.UploadException;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UsersControllerTest {
    @Mock VideoService videoService;
    @Mock UserService userService;
    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new UsersController(videoService, userService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private MockMultipartFile profile(String json) {
        return new MockMultipartFile("profile", "", "application/json", json.getBytes());
    }

    private UserResponse saved() {
        return new UserResponse(3L, "ada@example.test", "ada", "Ada", "Lovelace", LocalDateTime.now(),
                "Ada L.", "Bio", "/media/uploads/avatars/a.png");
    }

    @Test
    void updatesTheSessionAccountWithTextAndOptionalAvatar() throws Exception {
        when(userService.updateProfile(eq(3L), any(), any())).thenReturn(saved());
        var avatar = new MockMultipartFile("avatar", "me.png", "image/png", new byte[]{1});

        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me")
                        .file(profile("{\"displayName\":\"Ada L.\",\"description\":\"Bio\",\"id\":99}")).file(avatar)
                        .principal(() -> "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Ada L."))
                .andExpect(jsonPath("$.avatarUrl").value("/media/uploads/avatars/a.png"));

        var request = ArgumentCaptor.forClass(UpdateProfileRequest.class);
        verify(userService).updateProfile(eq(3L), request.capture(), eq(avatar));
        assertEquals("Ada L.", request.getValue().displayName());
        assertNull(request.getValue().removeAvatar());
    }

    @Test
    void avatarIsOptionalAndRemovalIsExplicit() throws Exception {
        when(userService.updateProfile(eq(3L), any(), isNull())).thenReturn(saved());
        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me").file(profile("{\"removeAvatar\":true}"))
                        .principal(() -> "3"))
                .andExpect(status().isOk());
        var request = ArgumentCaptor.forClass(UpdateProfileRequest.class);
        verify(userService).updateProfile(eq(3L), request.capture(), isNull());
        assertEquals(Boolean.TRUE, request.getValue().removeAvatar());
        assertNull(request.getValue().displayName());
    }

    @Test
    void rejectsOverlongTextAndMissingProfilePartBeforeReachingTheService() throws Exception {
        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me")
                        .file(profile("{\"displayName\":\"" + "x".repeat(101) + "\"}")).principal(() -> "3"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me")
                        .file(profile("{\"description\":\"" + "x".repeat(1001) + "\"}")).principal(() -> "3"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me")
                        .file(new MockMultipartFile("avatar", "me.png", "image/png", new byte[]{1})).principal(() -> "3"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(userService);
    }

    @Test
    void reportsRejectedAvatarsWithTheirStatusAndMessage() throws Exception {
        when(userService.updateProfile(eq(3L), any(), any()))
                .thenThrow(new UploadException(413, "Avatar exceeds 2 MiB"))
                .thenThrow(new UploadException(415, "Avatar must be JPG or PNG"));
        var avatar = new MockMultipartFile("avatar", "me.gif", "image/gif", new byte[]{1});
        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me").file(profile("{}")).file(avatar).principal(() -> "3"))
                .andExpect(status().isPayloadTooLarge()).andExpect(jsonPath("$.error").value("Avatar exceeds 2 MiB"));
        mockMvc.perform(multipart(HttpMethod.PATCH, "/api/users/me").file(profile("{}")).file(avatar).principal(() -> "3"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void analyticsReturnOwnVideosEmptyListAndForbiddenForAnotherAccount() throws Exception {
        when(videoService.getAnalyticsForOwner(3L, 3L)).thenReturn(
                List.of(new VideoAnalyticsResponse(7L, "Mine", 5, 2, 1)), List.of());
        when(videoService.getAnalyticsForOwner(4L, 3L)).thenThrow(new AccessDeniedException("Access denied"));

        mockMvc.perform(get("/api/users/3/analytics").principal(() -> "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].videoId").value(7))
                .andExpect(jsonPath("$[0].viewsCount").value(5)).andExpect(jsonPath("$[0].likesCount").value(2))
                .andExpect(jsonPath("$[0].commentsCount").value(1));
        mockMvc.perform(get("/api/users/3/analytics").principal(() -> "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/users/4/analytics").principal(() -> "3"))
                .andExpect(status().isForbidden());
    }
}
