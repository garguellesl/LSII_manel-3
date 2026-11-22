package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.entities.VideoLike.ReactionType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CatalogueMetricsRepository extends Repository<Video, Long> {
    interface VideoTag {
        Long getVideoId();
        String getName();
    }

    interface VideoCount {
        Long getVideoId();
        long getTotal();
    }

    interface Reactions {
        Long getVideoId();
        long getLikes();
        long getDislikes();
    }

    @Query("select v.id as videoId, t.name as name from Video v join v.tags t where v.id in :ids")
    List<VideoTag> tags(@Param("ids") List<Long> ids);

    @Query("""
            select r.video.id as videoId,
                   sum(case when r.reactionType = :likeType then 1 else 0 end) as likes,
                   sum(case when r.reactionType = :dislikeType then 1 else 0 end) as dislikes
            from VideoLike r where r.video.id in :ids group by r.video.id
            """)
    List<Reactions> reactions(@Param("ids") List<Long> ids, @Param("likeType") ReactionType likeType,
                              @Param("dislikeType") ReactionType dislikeType);

    @Query("""
            select c.video.id as videoId, count(c) as total from Comment c
            where c.video.id in :ids and c.deletedAt is null group by c.video.id
            """)
    List<VideoCount> visibleComments(@Param("ids") List<Long> ids);

    @Query("""
            select p.videoId as videoId, count(p) as total from VideoPlay p
            where p.videoId in :ids group by p.videoId
            """)
    List<VideoCount> plays(@Param("ids") List<Long> ids);
}
