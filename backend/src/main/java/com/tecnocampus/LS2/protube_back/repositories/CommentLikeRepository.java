package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    long countByCommentId(Long commentId);

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from CommentLike l where l.comment.id = :commentId and l.user.id = :userId")
    void removeOwnLike(Long commentId, Long userId);

    interface LikeTotals {
        Long getCommentId();
        long getLikesCount();
        long getOwnLikes();
    }

    @Query("""
            select l.comment.id as commentId, count(l) as likesCount,
                   sum(case when l.user.id = :actorId then 1 else 0 end) as ownLikes
            from CommentLike l
            where l.comment.video.id = :videoId and l.comment.deletedAt is null
            group by l.comment.id
            """)
    List<LikeTotals> summarizeVideo(Long videoId, Long actorId);
}
