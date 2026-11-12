package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UploadVideoRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotBlank String category,
        @Size(max = 40) List<@NotBlank @Size(max = 80) String> tags
) {
}
