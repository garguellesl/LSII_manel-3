package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.CommentResponse;
import com.tecnocampus.LS2.protube_back.model.UpdateCommentRequest;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
public class CommentsController {

    private final VideoService videoService;

    public CommentsController(VideoService videoService) {
        this.videoService = videoService;
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommentRequest request, Principal principal
    ) {
        return ResponseEntity.ok(videoService.updateComment(id, request, Long.valueOf(principal.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, Principal principal) {
        videoService.deleteComment(id, Long.valueOf(principal.getName()));
        return ResponseEntity.noContent().build();
    }
}
