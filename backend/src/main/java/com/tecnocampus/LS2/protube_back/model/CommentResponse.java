package com.tecnocampus.LS2.protube_back.model;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long videoId,
        Long userId,
        String accountName,
        String text,
        LocalDateTime createdAt,
        Long parentId,
        boolean deleted,
        LocalDateTime updatedAt,
        PublicAuthor author,
        long likesCount,
        boolean likedByMe,
        boolean canEdit
) {
}
