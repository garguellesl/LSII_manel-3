package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryResponse;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UsersController {

    private final VideoService videoService;

    public UsersController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/{id}/watch-history")
    public ResponseEntity<List<WatchHistoryResponse>> getWatchHistory(@PathVariable Long id) {
        return ResponseEntity.ok(videoService.getWatchHistory(id));
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<List<VideoAnalyticsResponse>> getAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(videoService.getAnalyticsForOwner(id));
    }
}
