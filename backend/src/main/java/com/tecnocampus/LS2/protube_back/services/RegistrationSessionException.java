package com.tecnocampus.LS2.protube_back.services;

public class RegistrationSessionException extends RuntimeException {
    public RegistrationSessionException(Throwable cause) {
        super("Account created, but sign-in could not be completed. Please sign in.", cause);
    }
}
