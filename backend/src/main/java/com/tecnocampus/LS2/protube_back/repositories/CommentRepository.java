package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    long countByVideoId(Long videoId);

    List<Comment> findByVideoIdOrderByCreatedAtAsc(Long videoId);
}
