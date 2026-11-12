package com.tecnocampus.LS2.protube_back.model;

public record LikeResponse(Long videoId, boolean liked, boolean disliked, long likesCount, long dislikesCount) {
    public LikeResponse(Long videoId, Long ignoredUserId, boolean liked, long likesCount) {
        this(videoId, liked, false, likesCount, 0);
    }
}
