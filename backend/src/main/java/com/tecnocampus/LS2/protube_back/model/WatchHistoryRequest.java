package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.PositiveOrZero;

public record WatchHistoryRequest(
        Long userId,
        @PositiveOrZero int progressSeconds
) {
}
