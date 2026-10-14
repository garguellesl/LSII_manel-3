package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {

    boolean existsByMediaPath(String mediaPath);

    @Query("select distinct video from Video video left join fetch video.owner left join fetch video.tags order by video.id asc")
    List<Video> findAllDetailedByOrderByIdAsc();

    @Query("select distinct video from Video video left join fetch video.owner left join fetch video.tags where video.id = :id")
    Optional<Video> findDetailedById(@Param("id") Long id);

    List<Video> findByOwnerIdOrderByIdAsc(Long ownerId);
}
