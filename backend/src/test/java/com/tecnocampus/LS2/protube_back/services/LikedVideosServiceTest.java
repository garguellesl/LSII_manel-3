package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import com.tecnocampus.LS2.protube_back.model.LikedVideosPage;
import com.tecnocampus.LS2.protube_back.repositories.VideoLikeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LikedVideosServiceTest {
    @Test
    void mapsOnlyCardFieldsAndPreservesPagination() {
        var reactions = mock(VideoLikeRepository.class);
        var withImage = mock(VideoLikeRepository.LikedVideo.class);
        var withoutImage = mock(VideoLikeRepository.LikedVideo.class);
        var page = PageRequest.of(1, 2);
        when(withImage.getId()).thenReturn(4L);
        when(withImage.getTitle()).thenReturn("Four");
        when(withImage.getThumbnailPath()).thenReturn("a\\thumb.webp");
        when(withoutImage.getId()).thenReturn(7L);
        when(withoutImage.getTitle()).thenReturn("Seven");
        when(reactions.findLikedVideos(3L, VideoLike.ReactionType.LIKE, page))
                .thenReturn(new PageImpl<>(List.of(withImage, withoutImage), page, 5));

        var expected = new LikedVideosPage(List.of(new LikedVideosPage.Item(4L, "Four", "/media/a/thumb.webp"),
                new LikedVideosPage.Item(7L, "Seven", null)), 1, 2, true, 5);
        assertEquals(expected, new LikedVideosService(reactions).getLikedVideos(3L, 1, 2));
    }
}
