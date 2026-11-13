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
        long viewsCount,
        long dislikesCount
) {
    public VideoSummary(Long id, String title, String thumbnailUrl, String videoUrl, List<String> tags, long likesCount, long commentsCount, long viewsCount) {
        this(id,title,thumbnailUrl,videoUrl,tags,likesCount,commentsCount,viewsCount,0);
    }
}
