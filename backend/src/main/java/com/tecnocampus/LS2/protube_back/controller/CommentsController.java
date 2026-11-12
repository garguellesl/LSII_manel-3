package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.CommentResponse;
import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CommentLikeResponse;
import com.tecnocampus.LS2.protube_back.model.UpdateCommentRequest;
import com.tecnocampus.LS2.protube_back.services.CommentService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CommentsController {

    private final CommentService commentService;

    public CommentsController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/videos/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(commentService.getComments(id, principal == null ? null : actor(principal)));
    }

    @PostMapping("/videos/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id,
            @Valid @RequestBody CommentRequest request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.addComment(id, request, actor(principal)));
    }

    @PatchMapping("/comments/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommentRequest request, Principal principal
    ) {
        return ResponseEntity.ok(commentService.updateComment(id, request, actor(principal)));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, Principal principal) {
        commentService.deleteComment(id, actor(principal));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/comments/{id}/likes")
    public ResponseEntity<CommentLikeResponse> likeComment(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(commentService.setLike(id, actor(principal), true));
    }

    @DeleteMapping("/comments/{id}/likes")
    public ResponseEntity<CommentLikeResponse> unlikeComment(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(commentService.setLike(id, actor(principal), false));
    }

    private Long actor(Principal principal) {
        return Long.valueOf(principal.getName());
    }
}
