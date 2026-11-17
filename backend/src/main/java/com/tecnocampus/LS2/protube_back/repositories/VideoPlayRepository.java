package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.VideoPlay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface VideoPlayRepository extends JpaRepository<VideoPlay, UUID> {

    long countByVideoId(Long videoId);

    // Atomic in PostgreSQL: a repeated or concurrent request with the same id inserts nothing.
    @Modifying
    @Query(value = "insert into video_plays(id, video_id) values (:id, :videoId) on conflict (id) do nothing",
            nativeQuery = true)
    int insertIfAbsent(@Param("id") UUID id, @Param("videoId") Long videoId);
}
