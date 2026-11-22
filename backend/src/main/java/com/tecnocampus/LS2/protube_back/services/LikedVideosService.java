package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import com.tecnocampus.LS2.protube_back.model.LikedVideosPage;
import com.tecnocampus.LS2.protube_back.repositories.VideoLikeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikedVideosService {
    private final VideoLikeRepository reactions;

    public LikedVideosService(VideoLikeRepository reactions) {
        this.reactions = reactions;
    }

    @Transactional(readOnly = true)
    public LikedVideosPage getLikedVideos(Long userId, int page, int size) {
        var result = reactions.findLikedVideos(userId, VideoLike.ReactionType.LIKE, PageRequest.of(page, size))
                .map(this::toItem);
        return new LikedVideosPage(result.getContent(), result.getNumber(), result.getSize(),
                result.hasNext(), result.getTotalElements());
    }

    private LikedVideosPage.Item toItem(VideoLikeRepository.LikedVideo video) {
        String path = video.getThumbnailPath();
        String thumbnailUrl = path == null || path.isBlank() ? null : "/media/" + path.replace('\\', '/');
        return new LikedVideosPage.Item(video.getId(), video.getTitle(), thumbnailUrl);
    }
}
