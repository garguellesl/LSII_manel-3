package com.tecnocampus.LS2.protube_back.services;

public class DeletedCommentException extends RuntimeException {
    public DeletedCommentException() {
        super("Comment deleted");
    }
}
