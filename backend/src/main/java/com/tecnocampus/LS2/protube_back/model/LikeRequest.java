package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.NotNull;

public record LikeRequest(
        @NotNull Long userId
) {
}
