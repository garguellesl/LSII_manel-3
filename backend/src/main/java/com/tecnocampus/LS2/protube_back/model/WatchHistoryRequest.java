package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record WatchHistoryRequest(
        @NotNull Long userId,
        @PositiveOrZero int progressSeconds
) {
}
