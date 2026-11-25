package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByAccountNameIgnoreCase(String accountName);

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findByAccountNameIgnoreCase(String accountName);

    // Public creators are accounts that own at least one video, in a stable order for paging.
    @Query("select u from UserAccount u where exists (select v.id from Video v where v.owner = u) order by u.id asc")
    Page<UserAccount> findCreatorsWithVideos(Pageable pageable);
}
