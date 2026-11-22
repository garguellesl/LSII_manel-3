package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.LikedVideosPage;
import com.tecnocampus.LS2.protube_back.services.LikedVideosService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class LikedVideosController {
    private final LikedVideosService likedVideos;

    public LikedVideosController(LikedVideosService likedVideos) {
        this.likedVideos = likedVideos;
    }

    @GetMapping("/api/users/me/liked-videos")
    public ResponseEntity<LikedVideosPage> list(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Expected page >= 0, size between 1 and 100 and a supported offset");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(likedVideos.getLikedVideos(Long.valueOf(principal.getName()), page, size));
    }
}
