package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Video;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {

    boolean existsByMediaPath(String mediaPath);

    // No collection fetch join: Pageable must limit rows in SQL, never in memory.
    @Query("""
            select video from Video video
            where :q = '' or locate(:q, lower(video.title)) > 0
                or locate(:q, lower(video.description)) > 0
            order by case when :q = '' then 0
                when lower(video.title) = :q then 0
                when locate(:q, lower(video.title)) > 0 then 1 else 2 end,
                video.id asc
            """)
    Slice<Video> search(@Param("q") String query, Pageable pageable);

    @Query("select distinct video from Video video left join fetch video.owner left join fetch video.tags where video.id = :id")
    Optional<Video> findDetailedById(@Param("id") Long id);

    List<Video> findByOwnerIdOrderByIdAsc(Long ownerId);
}
