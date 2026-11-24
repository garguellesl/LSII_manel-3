package com.tecnocampus.LS2.protube_back.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "deleted_media_paths")
public class DeletedMediaPath {

    @Id
    @Column(name = "media_path", nullable = false, length = 500)
    private String mediaPath;

    @Column(name = "deleted_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime deletedAt;

    protected DeletedMediaPath() {
    }

    public String getMediaPath() {
        return mediaPath;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }
}
