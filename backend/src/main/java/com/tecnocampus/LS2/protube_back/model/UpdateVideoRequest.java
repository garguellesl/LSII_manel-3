package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateVideoRequest(
        @Size(max = 255) String title,
        String description,
        List<@Size(max = 80) String> tags
) {
}
