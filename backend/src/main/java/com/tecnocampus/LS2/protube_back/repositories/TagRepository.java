package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query("select distinct t.name from Video v join v.tags t order by t.name")
    List<String> findAssociatedNames();

    Optional<Tag> findByNameIgnoreCase(String name);

    @Modifying
    @Query(value = "INSERT INTO tags (name) VALUES (:name) ON CONFLICT (name) DO NOTHING", nativeQuery = true)
    void insertIfAbsent(@Param("name") String name);
}
