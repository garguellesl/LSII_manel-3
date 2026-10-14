package com.tecnocampus.LS2.protube_back.model;

public record LikeResponse(
        Long videoId,
        Long userId,
        boolean liked,
        long likesCount
) {
}
