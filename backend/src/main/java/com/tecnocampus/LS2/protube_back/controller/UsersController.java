package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.model.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryResponse;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UsersController {
    private final VideoService videoService;
    private final UserService userService;

    public UsersController(VideoService videoService, UserService userService) {
        this.videoService = videoService;
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> profile(Principal principal) {
        return ResponseEntity.ok(userService.getProfile(Long.valueOf(principal.getName())));
    }

    @GetMapping("/{id}/watch-history")
    public ResponseEntity<List<WatchHistoryResponse>> getWatchHistory(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(videoService.getWatchHistory(id, Long.valueOf(principal.getName())));
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<List<VideoAnalyticsResponse>> getAnalytics(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(videoService.getAnalyticsForOwner(id, Long.valueOf(principal.getName())));
    }
}
