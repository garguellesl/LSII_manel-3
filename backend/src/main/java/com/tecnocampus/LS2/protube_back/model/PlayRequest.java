package com.tecnocampus.LS2.protube_back.model;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PlayRequest(@NotNull UUID playId) {
}
