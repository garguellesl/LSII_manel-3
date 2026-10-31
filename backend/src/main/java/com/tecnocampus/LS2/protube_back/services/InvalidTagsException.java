package com.tecnocampus.LS2.protube_back.services;

import java.util.Map;

public class InvalidTagsException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public InvalidTagsException(Map<String, String> fieldErrors) {
        super("Invalid tags: " + fieldErrors);
        this.fieldErrors = fieldErrors;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
