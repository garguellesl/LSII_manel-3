package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.services.VideoUploadService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class VideoUploadController {
    private final VideoUploadService uploads;

    public VideoUploadController(VideoUploadService uploads) {
        this.uploads = uploads;
    }

    @GetMapping("/categories")
    public Map<String, List<String>> categories() {
        return Map.of("categories", VideoUploadService.CATEGORIES);
    }

    @PostMapping(value = "/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoDetail> upload(@Valid @RequestPart("metadata") UploadVideoRequest metadata,
            @RequestPart("video") MultipartFile video,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail, Principal principal) {
        return created(uploads.upload(metadata, video, thumbnail, Long.valueOf(principal.getName())));
    }

    @PostMapping(value = "/videos", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VideoDetail> registerExisting(@Valid @RequestBody CreateVideoRequest request, Principal principal) {
        return created(uploads.registerExisting(request, Long.valueOf(principal.getName())));
    }

    private ResponseEntity<VideoDetail> created(VideoDetail video) {
        return ResponseEntity.created(URI.create("/api/videos/" + video.id())).body(video);
    }
}
