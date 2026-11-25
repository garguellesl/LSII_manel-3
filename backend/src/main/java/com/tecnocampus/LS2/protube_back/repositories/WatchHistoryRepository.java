package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {

    long countByVideoId(Long videoId);

    List<WatchHistory> findByUserIdOrderByWatchedAtDesc(Long userId);

    // One entry per video: the user's most recent view of it, newest first.
    @Query("select w from WatchHistory w where w.user.id = :userId and w.id in "
            + "(select max(h.id) from WatchHistory h where h.user.id = :userId group by h.video.id) "
            + "order by w.watchedAt desc, w.id desc")
    List<WatchHistory> findLatestPerVideo(@Param("userId") Long userId);
}
