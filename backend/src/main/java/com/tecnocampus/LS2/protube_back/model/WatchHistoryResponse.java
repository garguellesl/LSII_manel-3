package com.tecnocampus.LS2.protube_back.model;

import java.time.LocalDateTime;

public record WatchHistoryResponse(
        Long id,
        Long videoId,
        String videoTitle,
        int progressSeconds,
        LocalDateTime watchedAt
) {
}
