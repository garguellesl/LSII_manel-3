package com.tecnocampus.LS2.protube_back.services;

public class UploadException extends RuntimeException {
    private final int status;

    public UploadException(int status, String message) {
        super(message);
        this.status = status;
    }

    public UploadException(String message, Throwable cause) {
        super(message, cause);
        this.status = 503;
    }

    public int getStatus() {
        return status;
    }
}
