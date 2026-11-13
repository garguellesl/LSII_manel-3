package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoLikeRepository extends JpaRepository<VideoLike, Long> {

    long countByVideoId(Long videoId);

    long countByVideoIdAndReactionType(Long videoId, VideoLike.ReactionType reactionType);

    boolean existsByVideoIdAndUserId(Long videoId, Long userId);

    Optional<VideoLike> findByVideoIdAndUserId(Long videoId, Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "INSERT INTO video_likes(video_id,user_id,created_at,reaction_type) VALUES (:videoId,:userId,CURRENT_TIMESTAMP,:reaction) ON CONFLICT (video_id,user_id) DO UPDATE SET reaction_type=EXCLUDED.reaction_type", nativeQuery = true)
    void upsertReaction(@org.springframework.data.repository.query.Param("videoId") Long videoId, @org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("reaction") String reaction);

    void deleteByVideoIdAndUserIdAndReactionType(Long videoId, Long userId, VideoLike.ReactionType reactionType);
}
