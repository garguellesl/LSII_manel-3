package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.entities.VideoLike.ReactionType;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.repositories.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.projection.SpelAwareProxyProjectionFactory;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class CatalogueSummaryTest {
    private final VideoRepository repository = mock(VideoRepository.class);
    private final CatalogueMetricsRepository metrics = mock(CatalogueMetricsRepository.class);
    private final VideoService service = new VideoService(repository, mock(UserAccountRepository.class),
            mock(TagRepository.class), mock(CommentRepository.class), mock(VideoLikeRepository.class),
            mock(WatchHistoryRepository.class), mock(VideoPlayRepository.class),
            mock(DeletedMediaPathRepository.class), metrics);

    @Test
    void attachesRowsByIdAndPreservesSearchOrderAndJavaTagOrdering() {
        var later = mock(Video.class);
        var earlier = mock(Video.class);
        when(later.getId()).thenReturn(99L);
        when(earlier.getId()).thenReturn(1L);
        var page = PageRequest.of(0, 2);
        when(repository.search("demo", page)).thenReturn(new PageImpl<>(List.of(later, earlier), page, 5));
        var ids = List.of(99L, 1L);
        var projections = new SpelAwareProxyProjectionFactory();
        when(metrics.tags(ids)).thenReturn(List.of(
                projections.createProjection(CatalogueMetricsRepository.VideoTag.class, Map.of("videoId", 1L, "name", "é")),
                projections.createProjection(CatalogueMetricsRepository.VideoTag.class, Map.of("videoId", 1L, "name", "z"))));
        when(metrics.reactions(ids, ReactionType.LIKE, ReactionType.DISLIKE)).thenReturn(List.of(
                projections.createProjection(CatalogueMetricsRepository.Reactions.class,
                        Map.of("videoId", 1L, "likes", 4L, "dislikes", 2L))));
        when(metrics.visibleComments(ids)).thenReturn(List.of(projections.createProjection(
                CatalogueMetricsRepository.VideoCount.class, Map.of("videoId", 99L, "total", 3L))));
        when(metrics.plays(ids)).thenReturn(List.of(projections.createProjection(
                CatalogueMetricsRepository.VideoCount.class, Map.of("videoId", 1L, "total", 8L))));

        var result = service.getVideos(" DEMO ", 0, 2);
        assertEquals(List.of(new VideoSummary(99L, null, null, null, List.of(), 0, 3, 0, 0),
                new VideoSummary(1L, null, null, null, List.of("z", "é"), 4, 0, 8, 2)), result.content());
        assertEquals(5, result.totalElements());
        verify(later, never()).getTags();
        verify(earlier, never()).getTags();
    }

    @Test
    void emptyPageKeepsTotalAndSkipsAllEnrichment() {
        var page = PageRequest.of(3, 24);
        when(repository.search("", page)).thenReturn(new PageImpl<>(List.of(), page, 30));
        var result = service.getVideos("", 3, 24);
        assertEquals(List.of(), result.content());
        assertEquals(30, result.totalElements());
        verifyNoInteractions(metrics);
    }
}
