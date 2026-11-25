package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.Creator;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.ResultPage;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.State;
import com.tecnocampus.LS2.protube_back.model.CreatorSubscriptionResponse.Video;
import com.tecnocampus.LS2.protube_back.model.PublicAuthor;
import com.tecnocampus.LS2.protube_back.repositories.CreatorSubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repositories.CreatorVideoRepository;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CreatorSubscriptionService {
    private final CreatorSubscriptionRepository subscriptions;
    private final UserAccountRepository users;
    private final CreatorVideoRepository videos;

    public CreatorSubscriptionService(CreatorSubscriptionRepository subscriptions, UserAccountRepository users,
                                      CreatorVideoRepository videos) {
        this.subscriptions = subscriptions;
        this.users = users;
        this.videos = videos;
    }

    public State state(Long subscriber, Long creator) {
        requireCreator(creator);
        return new State(subscriptions.existsBySubscriberIdAndCreatorId(subscriber, creator));
    }

    @Transactional
    public void subscribe(Long subscriber, Long creator) {
        validateTarget(subscriber, creator);
        subscriptions.insert(subscriber, creator);
    }

    @Transactional
    public void unsubscribe(Long subscriber, Long creator) {
        validateTarget(subscriber, creator);
        subscriptions.remove(subscriber, creator);
    }

    public ResultPage<Creator> list(Long subscriber, Pageable page) {
        return ResultPage.from(subscriptions.findBySubscriberIdOrderByCreatedAtDescCreatorIdAsc(subscriber, page)
                .map(subscription -> publicCreator(subscription.getCreator())));
    }

    public Creator creator(Long creator) {
        return publicCreator(users.findById(creator).orElseThrow(() -> new ResourceNotFoundException("Creator not found")));
    }

    public ResultPage<Video> videos(Long creator, Pageable page) {
        requireCreator(creator);
        return ResultPage.from(videos.findByOwnerIdOrderByCreatedAtDescIdAsc(creator, page).map(video -> {
            String image = video.getThumbnailPath();
            String url = image == null || image.isBlank() ? null : "/media/" + image.replace('\\', '/');
            return new Video(video.getId(), video.getTitle(), url);
        }));
    }

    private void requireCreator(Long creator) {
        if (!users.existsById(creator)) {
            throw new ResourceNotFoundException("Creator not found");
        }
    }

    private void validateTarget(Long subscriber, Long creator) {
        if (subscriber.equals(creator)) {
            throw new IllegalArgumentException("You cannot subscribe to yourself");
        }
        requireCreator(creator);
    }

    private Creator publicCreator(UserAccount user) {
        var author = PublicAuthor.of(user.getId(), user.getPublicName(), user.getAvatarPath());
        return new Creator(author.id(), author.displayName(), author.avatarUrl(), user.getDescription());
    }
}
