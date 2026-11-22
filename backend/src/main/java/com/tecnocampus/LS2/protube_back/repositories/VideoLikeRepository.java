package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VideoLikeRepository extends JpaRepository<VideoLike, Long> {

    long countByVideoId(Long videoId);

    long countByVideoIdAndReactionType(Long videoId, VideoLike.ReactionType reactionType);

    boolean existsByVideoIdAndUserId(Long videoId, Long userId);

    Optional<VideoLike> findByVideoIdAndUserId(Long videoId, Long userId);

    @Modifying
    @Query(value = """
            INSERT INTO video_likes (video_id, user_id, created_at, reaction_type)
            VALUES (:videoId, :userId, CURRENT_TIMESTAMP, :reaction)
            ON CONFLICT (video_id, user_id) DO UPDATE SET
                created_at = CASE
                    WHEN EXCLUDED.reaction_type = 'LIKE' AND video_likes.reaction_type = 'DISLIKE'
                    THEN EXCLUDED.created_at ELSE video_likes.created_at END,
                reaction_type = EXCLUDED.reaction_type
            """, nativeQuery = true)
    void upsertReaction(@Param("videoId") Long videoId, @Param("userId") Long userId,
                        @Param("reaction") String reaction);

    @Query(value = """
            select video.id as id, video.title as title, video.thumbnailPath as thumbnailPath
            from VideoLike reaction join reaction.video video
            where reaction.user.id = :userId and reaction.reactionType = :type
            order by reaction.createdAt desc, video.id asc
            """, countQuery = """
            select count(reaction) from VideoLike reaction
            where reaction.user.id = :userId and reaction.reactionType = :type
            """)
    Page<LikedVideo> findLikedVideos(@Param("userId") Long userId, @Param("type") VideoLike.ReactionType type,
                                    Pageable pageable);

    void deleteByVideoIdAndUserIdAndReactionType(Long videoId, Long userId, VideoLike.ReactionType reactionType);

    interface LikedVideo {
        Long getId();
        String getTitle();
        String getThumbnailPath();
    }
}
