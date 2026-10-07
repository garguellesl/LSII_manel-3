package com.tecnocampus.LS2.protube_back.model;

public record VideoSummary(
        int id,
        String title,
        String thumbnailUrl,
        String videoUrl
) {
}
