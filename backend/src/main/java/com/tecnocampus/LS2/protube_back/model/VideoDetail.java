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
        long viewsCount,
        long dislikesCount
) {
    public VideoDetail(Long id, String title, String user, String description, double duration, String thumbnailUrl, String videoUrl, List<String> tags, long likesCount, long commentsCount, long viewsCount) {
        this(id,title,user,description,duration,thumbnailUrl,videoUrl,tags,likesCount,commentsCount,viewsCount,0);
    }
}
