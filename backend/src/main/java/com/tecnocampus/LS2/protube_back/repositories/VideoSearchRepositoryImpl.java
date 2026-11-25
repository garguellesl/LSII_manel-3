package com.tecnocampus.LS2.protube_back.repositories;

import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import com.tecnocampus.LS2.protube_back.entities.VideoPlay;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.AbstractQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

public class VideoSearchRepositoryImpl implements VideoSearchRepository {
    private final EntityManager entityManager;

    public VideoSearchRepositoryImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Page<Video> searchByTags(String query, List<String> tags, Pageable pageable) {
        return searchFiltered(query, tags, "relevance", "ALL", pageable);
    }

    @Override
    public Page<Video> searchFiltered(String query, List<String> tags, String sort, String audience, Pageable pageable) {
        var cb = entityManager.getCriteriaBuilder();
        var rows = cb.createQuery(Video.class);
        var video = rows.from(Video.class);
        var matches = tagMatches(cb, rows, video, tags);
        Expression<Integer> score = cb.literal(0);
        for (Predicate match : matches) {
            score = cb.sum(score, cb.<Integer>selectCase().when(match, 1).otherwise(0));
        }
        var title = cb.lower(video.<String>get("title"));
        var textRank = cb.<Integer>selectCase().when(cb.equal(title, query), 0)
                .when(cb.gt(cb.locate(title, query), 0), 1).otherwise(2);
        rows.select(video).where(filters(cb, video, query, matches, audience))
                .orderBy(cb.desc(score), cb.asc(textRank), cb.asc(video.get("id")));
        // Correlated COUNTs include zeros and cannot multiply rows through tags or reactions.
        if ("likes".equals(sort)) {
            var likes = rows.subquery(Long.class);
            var reaction = likes.from(VideoLike.class);
            likes.select(cb.count(reaction)).where(cb.equal(reaction.get("video"), video),
                    cb.equal(reaction.get("reactionType"), VideoLike.ReactionType.LIKE));
            rows.orderBy(cb.desc(likes), cb.asc(video.get("id")));
        } else if ("views".equals(sort)) {
            var views = rows.subquery(Long.class);
            var play = views.from(VideoPlay.class);
            views.select(cb.count(play)).where(cb.equal(play.get("videoId"), video.get("id")));
            rows.orderBy(cb.desc(views), cb.asc(video.get("id")));
        }

        var count = cb.createQuery(Long.class);
        var countedVideo = count.from(Video.class);
        count.select(cb.count(countedVideo)).where(filters(cb, countedVideo, query,
                tagMatches(cb, count, countedVideo, tags), audience));
        long total = entityManager.createQuery(count).getSingleResult();
        var content = entityManager.createQuery(rows)
                .setFirstResult(Math.toIntExact(pageable.getOffset()))
                .setMaxResults(pageable.getPageSize()).getResultList();
        return new PageImpl<>(content, pageable, total);
    }

    private List<Predicate> tagMatches(CriteriaBuilder cb, AbstractQuery<?> query, Root<Video> video,
                                       List<String> tags) {
        return tags.stream().map(term -> {
            var subquery = query.subquery(Integer.class);
            var tag = subquery.correlate(video).join("tags");
            subquery.select(cb.literal(1)).where(cb.equal(cb.lower(tag.get("name")), term));
            return cb.exists(subquery);
        }).toList();
    }

    private Predicate filters(CriteriaBuilder cb, Root<Video> video, String query, List<Predicate> matches, String audience) {
        var text = query.isEmpty() ? cb.conjunction() : cb.or(
                cb.gt(cb.locate(cb.lower(video.get("title")), query), 0),
                cb.gt(cb.locate(cb.lower(video.get("description")), query), 0));
        var tagFilter = matches.isEmpty() ? cb.conjunction() : cb.or(matches.toArray(Predicate[]::new));
        var audienceFilter = "ALL".equals(audience) ? cb.conjunction() : cb.equal(video.get("audience"), audience);
        return cb.and(text, tagFilter, audienceFilter);
    }
}
