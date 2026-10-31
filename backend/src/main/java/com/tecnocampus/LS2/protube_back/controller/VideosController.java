package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CommentResponse;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.LikeResponse;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoPage;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryRequest;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryResponse;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/videos")
public class VideosController {

    private final VideoService videoService;

    public VideosController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("")
    public ResponseEntity<VideoPage> getVideos(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        if (page < 0 || size < 1 || size > 100 || q.length() > 500) {
            throw new IllegalArgumentException("Expected page >= 0, size between 1 and 100, and q at most 500 characters");
        }
        return ResponseEntity.ok(videoService.getVideos(q, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoDetail> getVideo(@PathVariable Long id) {
        return videoService.getVideo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<VideoDetail> createVideo(@Valid @RequestBody CreateVideoRequest request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.createVideo(new CreateVideoRequest(
                request.title(), request.description(), request.mediaPath(), request.thumbnailPath(),
                request.durationSeconds(), Long.valueOf(principal.getName()), request.tags())));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<VideoDetail> updateVideo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVideoRequest request, Principal principal
    ) {
        return ResponseEntity.ok(videoService.updateVideo(id, request, Long.valueOf(principal.getName())));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(videoService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request, Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.addComment(id, new CommentRequest(Long.valueOf(principal.getName()), request.text())));
    }

    @PostMapping("/{id}/likes")
    public ResponseEntity<LikeResponse> likeVideo(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(videoService.likeVideo(id, Long.valueOf(principal.getName())));
    }

    @DeleteMapping("/{id}/likes")
    public ResponseEntity<LikeResponse> unlikeVideo(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(videoService.unlikeVideo(id, Long.valueOf(principal.getName())));
    }

    @PostMapping("/{id}/watch-history")
    public ResponseEntity<WatchHistoryResponse> recordWatch(
            @PathVariable Long id,
            @Valid @RequestBody WatchHistoryRequest request, Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.recordWatch(id, new WatchHistoryRequest(Long.valueOf(principal.getName()), request.progressSeconds())));
    }
}
