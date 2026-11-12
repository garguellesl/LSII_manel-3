package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.Comment;
import com.tecnocampus.LS2.protube_back.entities.CommentLike;
import com.tecnocampus.LS2.protube_back.model.*;
import com.tecnocampus.LS2.protube_back.repositories.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CommentService {
    private final CommentRepository comments;
    private final CommentLikeRepository likes;
    private final VideoRepository videos;
    private final UserAccountRepository users;

    public CommentService(CommentRepository comments, CommentLikeRepository likes,
                          VideoRepository videos, UserAccountRepository users) {
        this.comments = comments;
        this.likes = likes;
        this.videos = videos;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long videoId, Long actorId) {
        if (!videos.existsById(videoId)) throw new ResourceNotFoundException("Video not found");
        var discussion = comments.findDiscussion(videoId);
        var totals = likes.summarizeVideo(videoId, actorId == null ? -1L : actorId).stream()
                .collect(Collectors.toMap(CommentLikeRepository.LikeTotals::getCommentId, Function.identity()));
        return discussion.stream().map(comment -> {
            var total = totals.get(comment.getId());
            return response(comment, actorId, total == null ? 0 : total.getLikesCount(),
                    total != null && total.getOwnLikes() > 0);
        }).toList();
    }

    @Transactional
    public CommentResponse addComment(Long videoId, CommentRequest request, Long actorId) {
        requireActor(actorId);
        String text = validateText(request.text());
        var video = videos.findById(videoId).orElseThrow(() -> new ResourceNotFoundException("Video not found"));
        var user = users.findById(actorId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Comment parent = null;
        if (request.parentId() != null) {
            parent = comments.findForUpdate(request.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            if (!Objects.equals(parent.getVideo().getId(), videoId)) {
                throw new IllegalArgumentException("Parent comment must belong to the same video");
            }
            requireActive(parent);
        }
        var comment = comments.saveAndFlush(new Comment(video, user, text, parent));
        return response(comment, actorId, 0, false);
    }

    @Transactional
    public CommentResponse updateComment(Long id, UpdateCommentRequest request, Long actorId) {
        Comment comment = ownedComment(id, actorId);
        requireActive(comment);
        comment.updateText(validateText(request.text()));
        comments.flush();
        return response(comment, actorId, likes.countByCommentId(id), likes.existsByCommentIdAndUserId(id, actorId));
    }

    @Transactional
    public void deleteComment(Long id, Long actorId) {
        Comment comment = ownedComment(id, actorId);
        if (!comment.isDeleted()) comment.delete();
    }

    @Transactional
    public CommentLikeResponse setLike(Long id, Long actorId, boolean liked) {
        requireActor(actorId);
        Comment comment = lockedComment(id);
        requireActive(comment);
        var user = users.findById(actorId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (liked) {
            if (!likes.existsByCommentIdAndUserId(id, actorId)) {
                likes.saveAndFlush(new CommentLike(comment, user));
            }
        } else {
            likes.removeOwnLike(id, actorId);
        }
        return new CommentLikeResponse(id, liked, likes.countByCommentId(id));
    }

    private Comment lockedComment(Long id) {
        return comments.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    }

    private Comment ownedComment(Long id, Long actorId) {
        requireActor(actorId);
        Comment comment = lockedComment(id);
        if (!Objects.equals(comment.getUser().getId(), actorId)) throw new AccessDeniedException("Access denied");
        return comment;
    }

    private void requireActor(Long actorId) {
        if (actorId == null) throw new AccessDeniedException("Authentication required");
    }

    private void requireActive(Comment comment) {
        if (comment.isDeleted()) throw new DeletedCommentException();
    }

    private String validateText(String text) {
        if (text == null || text.length() > 2000 || text.codePoints()
                .allMatch(code -> Character.isWhitespace(code) || Character.isSpaceChar(code))) {
            throw new IllegalArgumentException("Comment must contain text and be at most 2000 characters");
        }
        return text.strip();
    }

    private CommentResponse response(Comment comment, Long actorId, long count, boolean liked) {
        var user = comment.getUser();
        boolean deleted = comment.isDeleted();
        return new CommentResponse(comment.getId(), comment.getVideo().getId(), user.getId(), user.getAccountName(),
                deleted ? "Comment deleted" : comment.getText(), comment.getCreatedAt(), comment.getParentId(),
                deleted, comment.getUpdatedAt(), new PublicAuthor(user.getId(), user.getAccountName(), null),
                deleted ? 0 : count, !deleted && liked, !deleted && Objects.equals(user.getId(), actorId));
    }
}
