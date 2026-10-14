package com.tecnocampus.LS2.protube_back.model;

public record VideoAnalyticsResponse(
        Long videoId,
        String title,
        long viewsCount,
        long likesCount,
        long commentsCount
) {
}
