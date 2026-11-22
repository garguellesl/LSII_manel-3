package com.tecnocampus.LS2.protube_back.model;

import java.util.List;

public record LikedVideosPage(List<Item> content, int page, int size, boolean hasNext, long totalElements) {
    public record Item(Long id, String title, String thumbnailUrl) {}
}
