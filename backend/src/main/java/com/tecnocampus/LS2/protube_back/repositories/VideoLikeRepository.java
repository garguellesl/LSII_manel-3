package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoLikeRepository extends JpaRepository<VideoLike, Long> {

    long countByVideoId(Long videoId);

    boolean existsByVideoIdAndUserId(Long videoId, Long userId);

    Optional<VideoLike> findByVideoIdAndUserId(Long videoId, Long userId);
}
