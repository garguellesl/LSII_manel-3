package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CommentResponse;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.LikeRequest;
import com.tecnocampus.LS2.protube_back.model.LikeResponse;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
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

@RestController
@RequestMapping("/api/videos")
public class VideosController {

    private final VideoService videoService;

    public VideosController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("")
    public ResponseEntity<List<VideoSummary>> getVideos() {
        return ResponseEntity.ok().body(videoService.getVideos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoDetail> getVideo(@PathVariable Long id) {
        return videoService.getVideo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<VideoDetail> createVideo(@Valid @RequestBody CreateVideoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.createVideo(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<VideoDetail> updateVideo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVideoRequest request
    ) {
        return ResponseEntity.ok(videoService.updateVideo(id, request));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(videoService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.addComment(id, request));
    }

    @PostMapping("/{id}/likes")
    public ResponseEntity<LikeResponse> likeVideo(
            @PathVariable Long id,
            @Valid @RequestBody LikeRequest request
    ) {
        return ResponseEntity.ok(videoService.likeVideo(id, request.userId()));
    }

    @DeleteMapping("/{id}/likes")
    public ResponseEntity<LikeResponse> unlikeVideo(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        return ResponseEntity.ok(videoService.unlikeVideo(id, userId));
    }

    @PostMapping("/{id}/watch-history")
    public ResponseEntity<WatchHistoryResponse> recordWatch(
            @PathVariable Long id,
            @Valid @RequestBody WatchHistoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.recordWatch(id, request));
    }
}
