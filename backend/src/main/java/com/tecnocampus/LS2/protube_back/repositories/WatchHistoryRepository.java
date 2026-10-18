package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {

    long countByVideoId(Long videoId);

    List<WatchHistory> findByUserIdOrderByWatchedAtDesc(Long userId);
}
