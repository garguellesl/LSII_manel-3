package com.tecnocampus.LS2.protube_back.model;

import org.springframework.data.domain.Page;

import java.util.List;

public final class CreatorSubscriptionResponse {
    private CreatorSubscriptionResponse() {}

    public record State(boolean subscribed) {}

    public record Creator(Long id, String displayName, String avatarUrl, String description) {}

    public record Video(Long id, String title, String thumbnailUrl) {}

    public record ResultPage<T>(List<T> content, int page, int size, boolean hasNext, long totalElements) {
        public static <T> ResultPage<T> from(Page<T> result) {
            return new ResultPage<>(result.getContent(), result.getNumber(), result.getSize(), result.hasNext(),
                    result.getTotalElements());
        }
    }
}
