package com.tecnocampus.LS2.protube_back.model;

import java.util.List;

public record VideoSummary(
        Long id,
        String title,
        String thumbnailUrl,
        String videoUrl,
        List<String> tags,
        long likesCount,
        long commentsCount,
        long viewsCount
) {
}
