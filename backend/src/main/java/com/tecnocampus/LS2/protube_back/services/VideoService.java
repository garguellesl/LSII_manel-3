package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.Comment;
import com.tecnocampus.LS2.protube_back.entities.Tag;
import com.tecnocampus.LS2.protube_back.entities.UserAccount;
import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.entities.VideoLike;
import com.tecnocampus.LS2.protube_back.entities.WatchHistory;
import com.tecnocampus.LS2.protube_back.model.CommentRequest;
import com.tecnocampus.LS2.protube_back.model.CommentResponse;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.LikeResponse;
import com.tecnocampus.LS2.protube_back.model.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateCommentRequest;
import com.tecnocampus.LS2.protube_back.model.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.model.VideoSummary;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryRequest;
import com.tecnocampus.LS2.protube_back.model.WatchHistoryResponse;
import com.tecnocampus.LS2.protube_back.repositories.CommentRepository;
import com.tecnocampus.LS2.protube_back.repositories.TagRepository;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoLikeRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import com.tecnocampus.LS2.protube_back.repositories.WatchHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
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
    public List<VideoSummary> getVideos() {
        return videoRepository.findAllDetailedByOrderByIdAsc().stream()
                .map(this::toSummary)
                .toList();
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
    public VideoDetail updateVideo(Long id, UpdateVideoRequest request) {
        Video video = findDetailedVideo(id);
        video.updateMetadata(
                blankToNull(request.title()),
                request.description() == null ? null : request.description().trim(),
                request.tags() == null ? null : resolveTags(request.tags())
        );
        return toDetail(video);
    }

    @Transactional
    public CommentResponse addComment(Long videoId, CommentRequest request) {
        Video video = findVideo(videoId);
        UserAccount user = findUser(request.userId());
        Comment comment = commentRepository.save(new Comment(video, user, request.text().trim()));
        return toCommentResponse(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long videoId) {
        if (!videoRepository.existsById(videoId)) {
            throw new ResourceNotFoundException("Video not found");
        }
        return commentRepository.findByVideoIdOrderByCreatedAtAsc(videoId).stream()
                .map(this::toCommentResponse)
                .toList();
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, UpdateCommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        comment.updateText(request.text().trim());
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new ResourceNotFoundException("Comment not found");
        }
        commentRepository.deleteById(commentId);
    }

    @Transactional
    public LikeResponse likeVideo(Long videoId, Long userId) {
        Video video = findVideo(videoId);
        UserAccount user = findUser(userId);
        if (!videoLikeRepository.existsByVideoIdAndUserId(videoId, userId)) {
            videoLikeRepository.save(new VideoLike(video, user));
        }
        return new LikeResponse(videoId, userId, true, videoLikeRepository.countByVideoId(videoId));
    }

    @Transactional
    public LikeResponse unlikeVideo(Long videoId, Long userId) {
        findVideo(videoId);
        findUser(userId);
        videoLikeRepository.findByVideoIdAndUserId(videoId, userId).ifPresent(videoLikeRepository::delete);
        return new LikeResponse(videoId, userId, false, videoLikeRepository.countByVideoId(videoId));
    }

    @Transactional
    public WatchHistoryResponse recordWatch(Long videoId, WatchHistoryRequest request) {
        WatchHistory watchHistory = watchHistoryRepository.save(
                new WatchHistory(findUser(request.userId()), findVideo(videoId), request.progressSeconds())
        );
        return toWatchHistoryResponse(watchHistory);
    }

    @Transactional(readOnly = true)
    public List<WatchHistoryResponse> getWatchHistory(Long userId) {
        if (!userAccountRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(userId).stream()
                .map(this::toWatchHistoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VideoAnalyticsResponse> getAnalyticsForOwner(Long ownerUserId) {
        if (!userAccountRepository.existsById(ownerUserId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return videoRepository.findByOwnerIdOrderByIdAsc(ownerUserId).stream()
                .map(video -> new VideoAnalyticsResponse(
                        video.getId(),
                        video.getTitle(),
                        watchHistoryRepository.countByVideoId(video.getId()),
                        videoLikeRepository.countByVideoId(video.getId()),
                        commentRepository.countByVideoId(video.getId())
                ))
                .toList();
    }

    private VideoSummary toSummary(Video video) {
        return new VideoSummary(
                video.getId(),
                video.getTitle(),
                urlFor(video.getThumbnailPath()),
                urlFor(video.getMediaPath()),
                tagNames(video),
                videoLikeRepository.countByVideoId(video.getId()),
                commentRepository.countByVideoId(video.getId()),
                watchHistoryRepository.countByVideoId(video.getId())
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
                videoLikeRepository.countByVideoId(video.getId()),
                commentRepository.countByVideoId(video.getId()),
                watchHistoryRepository.countByVideoId(video.getId())
        );
    }

    private CommentResponse toCommentResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getVideo().getId(),
                comment.getUser().getId(),
                comment.getUser().getAccountName(),
                comment.getText(),
                comment.getCreatedAt()
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

    private Set<Tag> resolveTags(List<String> tagNames) {
        Set<Tag> tags = new LinkedHashSet<>();
        if (tagNames == null) {
            return tags;
        }
        tagNames.stream()
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .map(String::toLowerCase)
                .distinct()
                .map(name -> tagRepository.findByNameIgnoreCase(name).orElseGet(() -> new Tag(name)))
                .forEach(tags::add);
        return tags;
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
