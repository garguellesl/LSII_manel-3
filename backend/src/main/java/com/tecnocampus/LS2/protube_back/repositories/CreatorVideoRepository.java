package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;

public interface CreatorVideoRepository extends Repository<Video, Long> {
    Page<Preview> findByOwnerIdOrderByCreatedAtDescIdAsc(Long ownerId, Pageable pageable);

    interface Preview {
        Long getId();
        String getTitle();
        String getThumbnailPath();
    }
}
