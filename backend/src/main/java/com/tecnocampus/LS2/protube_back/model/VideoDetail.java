package com.tecnocampus.LS2.protube_back.model;

import java.util.List;

public record VideoDetail(
        Long id,
        String title,
        String user,
        String description,
        double duration,
        String thumbnailUrl,
        String videoUrl,
        List<String> tags,
        long likesCount,
        long commentsCount,
        long viewsCount
) {
}
