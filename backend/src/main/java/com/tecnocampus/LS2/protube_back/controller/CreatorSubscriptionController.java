package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.Creator;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.ResultPage;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.State;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.Video;
import com.tecnocampus.LS2.protube_back.services.CreatorSubscriptionService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api")
public class CreatorSubscriptionController {
    private final CreatorSubscriptionService subscriptions;

    public CreatorSubscriptionController(CreatorSubscriptionService subscriptions) {
        this.subscriptions = subscriptions;
    }

    @GetMapping("/users/{creatorId}/subscription")
    public ResponseEntity<State> state(@PathVariable Long creatorId, Principal principal) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(subscriptions.state(actor(principal), creatorId));
    }

    @PutMapping("/users/{creatorId}/subscription")
    public ResponseEntity<Void> subscribe(@PathVariable Long creatorId, Principal principal) {
        subscriptions.subscribe(actor(principal), creatorId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{creatorId}/subscription")
    public ResponseEntity<Void> unsubscribe(@PathVariable Long creatorId, Principal principal) {
        subscriptions.unsubscribe(actor(principal), creatorId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/subscriptions")
    public ResponseEntity<ResultPage<Creator>> list(Principal principal, @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(subscriptions.list(actor(principal), paging(page, size)));
    }

    @GetMapping("/creators/{creatorId}")
    public Creator creator(@PathVariable Long creatorId) {
        return subscriptions.creator(creatorId);
    }

    @GetMapping("/creators/{creatorId}/videos")
    public ResultPage<Video> videos(@PathVariable Long creatorId, @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "24") int size) {
        return subscriptions.videos(creatorId, paging(page, size));
    }

    private Long actor(Principal principal) {
        return Long.valueOf(principal.getName());
    }

    private PageRequest paging(int page, int size) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Expected page >= 0, size between 1 and 100 and a supported offset");
        }
        return PageRequest.of(page, size);
    }
}
