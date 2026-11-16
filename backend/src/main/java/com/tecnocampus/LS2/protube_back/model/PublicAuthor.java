package com.tecnocampus.LS2.protube_back.model;

public record PublicAuthor(Long id, String displayName, String avatarUrl) {

    public static PublicAuthor of(Long id, String publicName, String avatarPath) {
        return new PublicAuthor(id, publicName,
                avatarPath == null || avatarPath.isBlank() ? null : "/media/" + avatarPath);
    }
}
