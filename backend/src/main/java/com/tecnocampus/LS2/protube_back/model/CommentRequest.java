package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotNull Long userId,
        @NotBlank @Size(max = 2000) String text
) {
}
