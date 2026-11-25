package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.model.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryResponse;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.model.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
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

    // The edited account is always the session's own: no caller-selected id.
    @PatchMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestPart("profile") UpdateProfileRequest profile,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            Principal principal) {
        return ResponseEntity.ok(userService.updateProfile(Long.valueOf(principal.getName()), profile, avatar));
    }

    // Profile background: its own endpoints, so the profile JSON and avatar contracts stay unchanged.
    @PutMapping(value = "/me/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateBanner(@RequestPart("banner") MultipartFile banner, Principal principal) {
        return ResponseEntity.ok(userService.updateBanner(Long.valueOf(principal.getName()), banner));
    }

    @DeleteMapping("/me/banner")
    public ResponseEntity<UserResponse> removeBanner(Principal principal) {
        return ResponseEntity.ok(userService.removeBanner(Long.valueOf(principal.getName())));
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
