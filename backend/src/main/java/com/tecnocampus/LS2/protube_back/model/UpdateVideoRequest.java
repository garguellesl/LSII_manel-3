package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public record UpdateVideoRequest(
        @Pattern(regexp = "(?s).*\\S.*", message = "must not be blank") @Size(max = 255) String title,
        String description,
        List<String> tags
) {
}
