package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.DeletedMediaPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeletedMediaPathRepository extends JpaRepository<DeletedMediaPath, String> {

    // Atomic in PostgreSQL: a repeated delete of the same media path tombstones it only once.
    @Modifying
    @Query(value = "insert into deleted_media_paths(media_path) values (:mediaPath) on conflict (media_path) do nothing",
            nativeQuery = true)
    int insertIfAbsent(@Param("mediaPath") String mediaPath);
}
