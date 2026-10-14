package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByNameIgnoreCase(String name);
}
