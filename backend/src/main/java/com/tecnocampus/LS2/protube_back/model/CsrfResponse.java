package com.tecnocampus.LS2.protube_back.model;

public record CsrfResponse(String token, String headerName) {
    @Override
    public String toString() {
        return "CsrfResponse[redacted]";
    }
}
