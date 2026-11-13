package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.Tag;
import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import com.tecnocampus.LS2.protube_back.entities.WatchHistory;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.LikeResponse;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.model.VideoPage;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryRequest;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryResponse;
import com.tecnocampus.LS2.protube_back.repositories.CommentRepository;
import com.tecnocampus.LS2.protube_back.repositories.TagRepository;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoLikeRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import com.tecnocampus.LS2.protube_back.repositories.WatchHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import java.util.Set;

@Service
public class VideoService {

    private final VideoRepository videoRepository;
    private final UserAccountRepository userAccountRepository;
    private final TagRepository tagRepository;
    private final CommentRepository commentRepository;
    private final VideoLikeRepository videoLikeRepository;
    private final WatchHistoryRepository watchHistoryRepository;

    public VideoService(VideoRepository videoRepository, UserAccountRepository userAccountRepository,
                        TagRepository tagRepository, CommentRepository commentRepository,
                        VideoLikeRepository videoLikeRepository, WatchHistoryRepository watchHistoryRepository) {
        this.videoRepository = videoRepository;
        this.userAccountRepository = userAccountRepository;
        this.tagRepository = tagRepository;
        this.commentRepository = commentRepository;
        this.videoLikeRepository = videoLikeRepository;
        this.watchHistoryRepository = watchHistoryRepository;
    }

    @Transactional(readOnly = true)
    public VideoPage getVideos(String query, int page, int size) {
        return getVideos(query, List.of(), page, size);
    }

    @Transactional(readOnly = true)
    public VideoPage getVideos(String query, List<String> tags, int page, int size) {
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        var filters = tags.stream().filter(Objects::nonNull).map(String::trim)
                .map(tag -> tag.toLowerCase(Locale.ROOT)).filter(tag -> !tag.isEmpty()).distinct().toList();
        if (filters.size() > 40 || filters.stream().anyMatch(tag -> tag.length() > 80)) {
            throw new IllegalArgumentException("Expected at most 40 distinct tag filters, each at most 80 characters");
        }
        var pageable = PageRequest.of(page, size);
        var result = filters.isEmpty() ? videoRepository.search(normalized, pageable)
                : videoRepository.searchByTags(normalized, filters, pageable);
        return new VideoPage(result.getContent().stream().map(this::toSummary).toList(),
                page, size, result.hasNext(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableTags() {
        return tagRepository.findAssociatedNames();
    }

    @Transactional(readOnly = true)
    public Optional<VideoDetail> getVideo(Long id) {
        return videoRepository.findDetailedById(id).map(this::toDetail);
    }

    @Transactional
    public VideoDetail createVideo(CreateVideoRequest request) {
        String mediaPath = normalizeStorePath(request.mediaPath());
        String thumbnailPath = request.thumbnailPath() == null || request.thumbnailPath().isBlank()
                ? null
                : normalizeStorePath(request.thumbnailPath());
        if (videoRepository.existsByMediaPath(mediaPath)) {
            throw new DuplicateResourceException("Video media path is already registered");
        }

        UserAccount owner = findUser(request.ownerUserId());
        Video video = new Video(
                request.title().trim(),
                request.description().trim(),
                mediaPath,
                thumbnailPath,
                request.durationSeconds(),
                owner,
                resolveTags(request.tags())
        );
        return toDetail(videoRepository.save(video));
    }

    @Transactional
    public VideoDetail updateVideo(Long id, UpdateVideoRequest request, Long actorId) {
        Video video = findDetailedVideo(id);
        requireSameUser(video.getOwner().getId(), actorId);
        video.updateMetadata(
                blankToNull(request.title()),
                request.description() == null ? null : request.description().trim(),
                request.tags() == null ? null : resolveTags(request.tags())
        );
        return toDetail(video);
    }

    @Transactional
    public LikeResponse likeVideo(Long videoId, Long userId) {
        return setReaction(videoId, userId, VideoLike.ReactionType.LIKE);
    }

    @Transactional
    public LikeResponse unlikeVideo(Long videoId, Long userId) {
        return removeReaction(videoId, userId, VideoLike.ReactionType.LIKE);
    }

    @Transactional public LikeResponse dislikeVideo(Long videoId, Long userId) { return setReaction(videoId, userId, VideoLike.ReactionType.DISLIKE); }
    @Transactional public LikeResponse undislikeVideo(Long videoId, Long userId) { return removeReaction(videoId, userId, VideoLike.ReactionType.DISLIKE); }
    @Transactional(readOnly = true) public LikeResponse getReaction(Long videoId, Long userId) {
        findVideo(videoId); findUser(userId);
        var reaction = videoLikeRepository.findByVideoIdAndUserId(videoId, userId).map(VideoLike::getReactionType).orElse(null);
        return reactionResponse(videoId, reaction);
    }
    private LikeResponse setReaction(Long videoId, Long userId, VideoLike.ReactionType reaction) {
        findVideo(videoId); findUser(userId);
        videoLikeRepository.upsertReaction(videoId, userId, reaction.name());
        return reactionResponse(videoId, reaction);
    }
    private LikeResponse removeReaction(Long videoId, Long userId, VideoLike.ReactionType reaction) {
        findVideo(videoId); findUser(userId);
        videoLikeRepository.deleteByVideoIdAndUserIdAndReactionType(videoId, userId, reaction);
        return reactionResponse(videoId, videoLikeRepository.findByVideoIdAndUserId(videoId, userId).map(VideoLike::getReactionType).orElse(null));
    }
    private LikeResponse reactionResponse(Long videoId, VideoLike.ReactionType reaction) {
        return new LikeResponse(videoId, reaction == VideoLike.ReactionType.LIKE, reaction == VideoLike.ReactionType.DISLIKE,
                videoLikeRepository.countByVideoIdAndReactionType(videoId, VideoLike.ReactionType.LIKE),
                videoLikeRepository.countByVideoIdAndReactionType(videoId, VideoLike.ReactionType.DISLIKE));
    }

    @Transactional
    public WatchHistoryResponse recordWatch(Long videoId, WatchHistoryRequest request) {
        WatchHistory watchHistory = watchHistoryRepository.save(
                new WatchHistory(findUser(request.userId()), findVideo(videoId), request.progressSeconds())
        );
        return toWatchHistoryResponse(watchHistory);
    }

    @Transactional(readOnly = true)
    public List<WatchHistoryResponse> getWatchHistory(Long userId, Long actorId) {
        requireSameUser(userId, actorId);
        if (!userAccountRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(userId).stream()
                .map(this::toWatchHistoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VideoAnalyticsResponse> getAnalyticsForOwner(Long ownerUserId, Long actorId) {
        requireSameUser(ownerUserId, actorId);
        if (!userAccountRepository.existsById(ownerUserId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return videoRepository.findByOwnerIdOrderByIdAsc(ownerUserId).stream()
                .map(video -> new VideoAnalyticsResponse(
                        video.getId(),
                        video.getTitle(),
                        watchHistoryRepository.countByVideoId(video.getId()),
                        videoLikeRepository.countByVideoIdAndReactionType(video.getId(), VideoLike.ReactionType.LIKE),
                        commentRepository.countByVideoIdAndDeletedAtIsNull(video.getId())
                ))
                .toList();
    }

    private void requireSameUser(Long ownerId, Long actorId) {
        if (actorId == null || !Objects.equals(ownerId, actorId)) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private VideoSummary toSummary(Video video) {
        return new VideoSummary(
                video.getId(),
                video.getTitle(),
                urlFor(video.getThumbnailPath()),
                urlFor(video.getMediaPath()),
                tagNames(video),
                videoLikeRepository.countByVideoIdAndReactionType(video.getId(), VideoLike.ReactionType.LIKE),
                commentRepository.countByVideoIdAndDeletedAtIsNull(video.getId()),
                watchHistoryRepository.countByVideoId(video.getId()),
                videoLikeRepository.countByVideoIdAndReactionType(video.getId(), VideoLike.ReactionType.DISLIKE)
        );
    }

    private VideoDetail toDetail(Video video) {
        return new VideoDetail(
                video.getId(),
                video.getTitle(),
                video.getOwner().getAccountName(),
                video.getDescription(),
                video.getDurationSeconds(),
                urlFor(video.getThumbnailPath()),
                urlFor(video.getMediaPath()),
                tagNames(video),
                videoLikeRepository.countByVideoIdAndReactionType(video.getId(), VideoLike.ReactionType.LIKE),
                commentRepository.countByVideoIdAndDeletedAtIsNull(video.getId()),
                watchHistoryRepository.countByVideoId(video.getId()),
                videoLikeRepository.countByVideoIdAndReactionType(video.getId(), VideoLike.ReactionType.DISLIKE),
                video.getCategory(),
                video.getSource()
        );
    }

    private WatchHistoryResponse toWatchHistoryResponse(WatchHistory watchHistory) {
        return new WatchHistoryResponse(
                watchHistory.getId(),
                watchHistory.getVideo().getId(),
                watchHistory.getVideo().getTitle(),
                watchHistory.getProgressSeconds(),
                watchHistory.getWatchedAt()
        );
    }

    @Transactional
    public void attachImportedTagsIfMissing(String mediaPath, List<String> rawTagNames) {
        videoRepository.findByMediaPath(mediaPath).ifPresent(video -> {
            if (!video.hasInitializedTags() && video.getTags().isEmpty()) {
                video.updateMetadata(null, null, resolveTags(rawTagNames));
            }
        });
    }

    private Set<Tag> resolveTags(List<String> rawTagNames) {
        if (rawTagNames == null) {
            return new LinkedHashSet<>();
        }
        TagNormalizer.Result result = TagNormalizer.normalizeAndValidate(rawTagNames);
        if (!result.isValid()) {
            throw new InvalidTagsException(result.fieldErrors());
        }
        Set<Tag> tags = new LinkedHashSet<>();
        for (String name : result.normalizedTags()) {
            tags.add(findOrCreateTag(name));
        }
        return tags;
    }

    private Tag findOrCreateTag(String name) {
        return tagRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    tagRepository.insertIfAbsent(name);
                    return tagRepository.findByNameIgnoreCase(name)
                            .orElseThrow(() -> new IllegalStateException("Tag lookup failed after insert: " + name));
                });
    }

    private List<String> tagNames(Video video) {
        return video.getTags().stream()
                .map(Tag::getName)
                .sorted()
                .toList();
    }

    private Video findVideo(Long id) {
        return videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found"));
    }

    private Video findDetailedVideo(Long id) {
        return videoRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found"));
    }

    private UserAccount findUser(Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String normalizeStorePath(String rawPath) {
        String trimmed = rawPath.trim().replace('\\', '/');
        try {
            Path path = Path.of(trimmed).normalize();
            if (path.isAbsolute() || path.startsWith("..") || trimmed.startsWith("/")) {
                throw new IllegalArgumentException("Store paths must be relative to pro_tube.store.dir");
            }
            return path.toString().replace('\\', '/');
        } catch (InvalidPathException exception) {
            throw new IllegalArgumentException("Invalid store path");
        }
    }

    private String urlFor(String storePath) {
        if (storePath == null || storePath.isBlank()) {
            return null;
        }
        return "/media/" + storePath.replace('\\', '/');
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
