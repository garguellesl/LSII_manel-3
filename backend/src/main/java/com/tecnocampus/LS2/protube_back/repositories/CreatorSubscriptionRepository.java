package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.CreatorSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface CreatorSubscriptionRepository extends Repository<CreatorSubscription, Long> {
    boolean existsBySubscriberIdAndCreatorId(Long subscriberId, Long creatorId);

    @EntityGraph(attributePaths = "creator")
    Page<CreatorSubscription> findBySubscriberIdOrderByCreatedAtDescCreatorIdAsc(Long subscriberId, Pageable pageable);

    @Modifying
    @Query(value = """
            INSERT INTO creator_subscriptions (subscriber_id, creator_id)
            VALUES (:subscriberId, :creatorId)
            ON CONFLICT (subscriber_id, creator_id) DO NOTHING
            """, nativeQuery = true)
    void insert(@Param("subscriberId") Long subscriberId, @Param("creatorId") Long creatorId);

    @Modifying
    @Query("delete from CreatorSubscription s where s.subscriber.id = :subscriberId and s.creator.id = :creatorId")
    void remove(@Param("subscriberId") Long subscriberId, @Param("creatorId") Long creatorId);
}
