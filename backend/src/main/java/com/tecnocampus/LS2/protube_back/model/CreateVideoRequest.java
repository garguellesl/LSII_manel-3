package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateVideoRequest(
        @NotBlank @Size(max = 255) String title,
        @NotNull String description,
        @NotBlank @Size(max = 500) String mediaPath,
        @Size(max = 500) String thumbnailPath,
        @PositiveOrZero double durationSeconds,
        @NotNull Long ownerUserId,
        List<@Size(max = 80) String> tags
) {
}
