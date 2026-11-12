package com.tecnocampus.LS2.protube_back.model;

public record CommentLikeResponse(Long commentId, boolean likedByMe, long likesCount) {
}
