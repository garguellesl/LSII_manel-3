package com.tecnocampus.LS2.protube_back.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "video_plays")
public class VideoPlay {

    @Id
    private UUID id;

    @Column(name = "video_id", nullable = false)
    private Long videoId;

    @Column(name = "played_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime playedAt;

    protected VideoPlay() {
    }

    public UUID getId() {
        return id;
    }

    public Long getVideoId() {
        return videoId;
    }

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }
}
