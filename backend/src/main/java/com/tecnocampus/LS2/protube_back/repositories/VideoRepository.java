package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Video;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long>, VideoSearchRepository {

    @Query(value = """
            with recent as (
                select video_id from watch_history where user_id = :actor
                order by watched_at desc, id desc limit 20
            ), preferences as (
                select tag_id, count(*) as weight from recent
                join video_tags using (video_id) group by tag_id
            ), source_tags as (
                select tag_id from video_tags where video_id = :id
            )
            select v.* from videos v cross join videos source
            left join video_tags vt on vt.video_id = v.id
            left join preferences p on p.tag_id = vt.tag_id
            left join source_tags st on st.tag_id = vt.tag_id
            where source.id = :id and v.id <> source.id
              and (:audience = 'ALL' or v.audience = :audience)
            group by v.id, source.category
            order by coalesce(sum(p.weight), 0) desc, count(st.tag_id) desc,
                     case when v.category = source.category then 0 else 1 end,
                     v.created_at desc, v.id asc
            limit 8
            """, nativeQuery = true)
    List<Video> recommendations(@Param("id") Long id, @Param("actor") Long actor,
                                @Param("audience") String audience);

    boolean existsByMediaPath(String mediaPath);

    Optional<Video> findByMediaPath(String mediaPath);

    // No collection fetch join: Pageable must limit rows in SQL, never in memory.
    @Query(value = """
            select video from Video video
            where :q = '' or locate(:q, lower(video.title)) > 0
                or locate(:q, lower(video.description)) > 0
            order by case when :q = '' then 0
                when lower(video.title) = :q then 0
                when locate(:q, lower(video.title)) > 0 then 1 else 2 end,
                video.id asc
            """, countQuery = """
            select count(video) from Video video
            where :q = '' or locate(:q, lower(video.title)) > 0
                or locate(:q, lower(video.description)) > 0
            """)
    Page<Video> search(@Param("q") String query, Pageable pageable);

    @Query("select distinct video from Video video left join fetch video.owner left join fetch video.tags where video.id = :id")
    Optional<Video> findDetailedById(@Param("id") Long id);

    List<Video> findByOwnerIdOrderByIdAsc(Long ownerId);
}
