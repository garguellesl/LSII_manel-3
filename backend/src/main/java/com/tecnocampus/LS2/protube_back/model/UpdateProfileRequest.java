package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100) String displayName,
        @Size(max = 1000) String description,
        Boolean removeAvatar
) {
}
