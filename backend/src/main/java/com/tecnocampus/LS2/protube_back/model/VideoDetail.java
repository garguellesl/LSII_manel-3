package com.tecnocampus.LS2.protube_back.model;

public record VideoDetail(
        int id,
        String title,
        String user,
        String description,
        double duration,
        String thumbnailUrl,
        String videoUrl
) {
}
