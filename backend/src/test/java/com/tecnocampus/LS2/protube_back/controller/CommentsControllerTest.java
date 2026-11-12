package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.*;
import com.tecnocampus.LS2.protube_back.services.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CommentsControllerTest {
    @Mock CommentService service;
    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new CommentsController(service))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }

    @Test
    void publicListAndAuthenticatedStateKeepCompatibleResponse() throws Exception {
        when(service.getComments(7L, null)).thenReturn(List.of());
        when(service.getComments(7L, 3L)).thenReturn(List.of(comment()));
        mvc.perform(get("/api/videos/7/comments")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/videos/7/comments").principal(() -> "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].accountName").value("author"))
                .andExpect(jsonPath("$[0].createdAt").isArray()).andExpect(jsonPath("$[0].updatedAt").isArray())
                .andExpect(jsonPath("$[0].author.id").value(3)).andExpect(jsonPath("$[0].author.email").doesNotExist())
                .andExpect(jsonPath("$[0].likesCount").value(2)).andExpect(jsonPath("$[0].canEdit").value(true));
    }

    @Test
    void creationIgnoresSpoofedUserIdAndPassesParent() throws Exception {
        when(service.addComment(eq(7L), any(), eq(3L))).thenReturn(comment());
        mvc.perform(post("/api/videos/7/comments").principal(() -> "3").contentType("application/json")
                        .content("{\"text\":\"reply\",\"parentId\":1,\"userId\":999}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.userId").value(3));
        verify(service).addComment(7L, new CommentRequest("reply", 1L), 3L);
    }

    @Test
    void rejectsBlankMissingAndOversizedTextAtBoundary() throws Exception {
        for (String body : List.of("{}", "{\"text\":\"   \"}", "{\"text\":\"" + "x".repeat(2001) + "\"}")) {
            mvc.perform(post("/api/videos/7/comments").principal(() -> "3").contentType("application/json").content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.text").exists());
            mvc.perform(patch("/api/comments/5").principal(() -> "3").contentType("application/json").content(body))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(service);
    }

    @Test
    void updatesDeletesAndTogglesLikes() throws Exception {
        when(service.updateComment(eq(5L), any(), eq(3L))).thenReturn(comment());
        when(service.setLike(5L, 3L, true)).thenReturn(new CommentLikeResponse(5L, true, 1));
        when(service.setLike(5L, 3L, false)).thenReturn(new CommentLikeResponse(5L, false, 0));
        mvc.perform(patch("/api/comments/5").principal(() -> "3").contentType("application/json").content("{\"text\":\"edited\"}"))
                .andExpect(status().isOk());
        verify(service).updateComment(5L, new UpdateCommentRequest("edited"), 3L);
        mvc.perform(delete("/api/comments/5").principal(() -> "3")).andExpect(status().isNoContent());
        verify(service).deleteComment(5L, 3L);
        mvc.perform(post("/api/comments/5/likes").principal(() -> "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.likedByMe").value(true));
        mvc.perform(delete("/api/comments/5/likes").principal(() -> "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.likesCount").value(0));
    }

    @Test
    void translatesMissingInvalidAndDeletedResources() throws Exception {
        when(service.getComments(7L, null)).thenThrow(new ResourceNotFoundException("Video not found"));
        when(service.addComment(eq(7L), any(), eq(3L))).thenThrow(new IllegalArgumentException("Invalid parent"));
        when(service.setLike(5L, 3L, true)).thenThrow(new DeletedCommentException());
        mvc.perform(get("/api/videos/7/comments")).andExpect(status().isNotFound());
        mvc.perform(post("/api/videos/7/comments").principal(() -> "3").contentType("application/json").content("{\"text\":\"reply\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/comments/5/likes").principal(() -> "3"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("COMMENT_DELETED"));
    }

    private CommentResponse comment() {
        return new CommentResponse(5L, 7L, 3L, "author", "reply", LocalDateTime.now(), 1L, false,
                LocalDateTime.now(), new PublicAuthor(3L, "author", null), 2, true, true);
    }
}
