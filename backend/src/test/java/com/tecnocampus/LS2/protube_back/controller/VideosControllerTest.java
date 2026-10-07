package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideosControllerTest {

    @InjectMocks
    VideosController videosController;

    @Autowired
    @Mock
    VideoService videoService;


    @Test
    void getVideos() {
        List<VideoSummary> videos = List.of(
                new VideoSummary(1, "video 1", "/media/1.webp", "/media/1.mp4"),
                new VideoSummary(2, "video 2", "/media/2.webp", "/media/2.mp4")
        );
        when(videoService.getVideos()).thenReturn(videos);
        assertEquals(videos, videosController.getVideos().getBody());
    }
}