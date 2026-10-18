package com.tecnocampus.LS2.protube_back.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "watch_history")
public class WatchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @Column(name = "watched_at", nullable = false)
    private LocalDateTime watchedAt;

    @Column(name = "progress_seconds", nullable = false)
    private int progressSeconds;

    protected WatchHistory() {
    }

    public WatchHistory(UserAccount user, Video video, int progressSeconds) {
        this.user = user;
        this.video = video;
        this.progressSeconds = progressSeconds;
    }

    @PrePersist
    void prePersist() {
        watchedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Video getVideo() {
        return video;
    }

    public LocalDateTime getWatchedAt() {
        return watchedAt;
    }

    public int getProgressSeconds() {
        return progressSeconds;
    }
}
