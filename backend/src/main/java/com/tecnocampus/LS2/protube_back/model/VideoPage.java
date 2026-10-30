package com.tecnocampus.LS2.protube_back.model;

import java.util.List;

public record VideoPage(List<VideoSummary> content, int page, int size, boolean hasNext) {
}
