package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.model.*;
import com.tecnocampus.LS2.protube_back.repositories.CommentRepository;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
class CommentServiceTest extends PostgreSqlIntegrationTest {
    @Autowired CommentService comments;
    @Autowired VideoService videos;
    @Autowired UserService users;
    @Autowired CommentRepository repository;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entities;
    Long author;
    Long other;
    Long video;

    @BeforeEach
    void setUp() {
        author = account();
        other = account();
        video = videos.createVideo(new CreateVideoRequest("Discussion", "", UUID.randomUUID() + ".mp4",
                null, 0, author, List.of())).id();
    }

    @Test
    void emptyDiscussionAndMissingResources() {
        assertTrue(comments.getComments(video, null).isEmpty());
        assertThrows(ResourceNotFoundException.class, () -> comments.getComments(-1L, null));
        assertThrows(ResourceNotFoundException.class, () -> comments.addComment(-1L, request("text", null), author));
        assertThrows(ResourceNotFoundException.class, () -> comments.addComment(video, request("text", null), -1L));
        assertThrows(ResourceNotFoundException.class, () -> comments.updateComment(-1L, new UpdateCommentRequest("x"), author));
        assertThrows(ResourceNotFoundException.class, () -> comments.deleteComment(-1L, author));
        assertThrows(ResourceNotFoundException.class, () -> comments.setLike(-1L, author, true));
    }

    @Test
    void nestedRepliesPreserveParentsAndStableCreationOrderAfterEditing() {
        var root = comments.addComment(video, request("  root  ", null), author);
        var second = comments.addComment(video, request("second root", null), other);
        var reply = comments.addComment(video, request("reply", root.id()), other);
        var deep = comments.addComment(video, request("deep reply", reply.id()), author);
        var edited = comments.updateComment(root.id(), new UpdateCommentRequest("edited"), author);
        assertEquals(root.createdAt(), edited.createdAt());
        assertNotNull(edited.updatedAt());
        assertEquals("root", root.text());
        assertEquals(root.id(), reply.parentId());
        assertEquals(reply.id(), deep.parentId());
        assertNull(root.parentId());
        assertEquals(List.of(root.id(), second.id(), reply.id(), deep.id()),
                comments.getComments(video, null).stream().map(CommentResponse::id).toList());
        // Equal creation times must still have a deterministic order independent of edits.
        jdbc.update("update comments set created_at = timestamp '2026-01-01 00:00:00' where video_id = ?", video);
        entities.clear();
        assertEquals(List.of(root.id(), second.id(), reply.id(), deep.id()),
                comments.getComments(video, author).stream().map(CommentResponse::id).toList());
    }

    @Test
    void validatesWhitespaceLengthAndParentVideoWithoutChangingExistingText() {
        var root = comments.addComment(video, request("valid", null), author);
        for (String invalid : new String[]{null, "", " \n\t", "\u00a0\u2003", "x".repeat(2001)}) {
            assertThrows(IllegalArgumentException.class, () -> comments.addComment(video, request(invalid, null), author));
            assertThrows(IllegalArgumentException.class, () -> comments.updateComment(root.id(), new UpdateCommentRequest(invalid), author));
        }
        assertEquals("valid", repository.findById(root.id()).orElseThrow().getText());
        assertEquals(2000, comments.addComment(video, request("x".repeat(2000), null), author).text().length());
        assertThrows(IllegalArgumentException.class, () -> comments.addComment(video, request("bad", -1L), author));
        Long otherVideo = videos.createVideo(new CreateVideoRequest("Other", "", UUID.randomUUID() + ".mp4",
                null, 0, author, List.of())).id();
        assertThrows(IllegalArgumentException.class, () -> comments.addComment(otherVideo, request("bad", root.id()), author));
    }

    @Test
    void rawMarkupRemainsTextAndAuthorContainsOnlyPublicRepresentation() {
        String text = "<script>alert('xss')</script><img src=x onerror=alert(1)>";
        var result = comments.addComment(video, request(text, null), author);
        assertEquals(text, result.text());
        assertEquals(author, result.author().id());
        assertEquals(result.accountName(), result.author().displayName());
        assertNull(result.author().avatarUrl());
        assertTrue(result.canEdit());
        assertFalse(comments.getComments(video, other).getFirst().canEdit());
        assertFalse(comments.getComments(video, null).getFirst().canEdit());
    }

    @Test
    void ownerOnlyAndNoAnonymousMutations() {
        var root = comments.addComment(video, request("root", null), author);
        assertThrows(AccessDeniedException.class, () -> comments.updateComment(root.id(), new UpdateCommentRequest("bad"), other));
        assertThrows(AccessDeniedException.class, () -> comments.deleteComment(root.id(), other));
        assertThrows(AccessDeniedException.class, () -> comments.addComment(video, request("bad", null), null));
        assertThrows(AccessDeniedException.class, () -> comments.updateComment(root.id(), new UpdateCommentRequest("bad"), null));
        assertThrows(AccessDeniedException.class, () -> comments.deleteComment(root.id(), null));
        assertThrows(AccessDeniedException.class, () -> comments.setLike(root.id(), null, true));
    }

    @Test
    void deletionIsIdempotentErasesTextPreservesRepliesAndBlocksMutations() {
        var root = comments.addComment(video, request("private original text", null), author);
        var child = comments.addComment(video, request("retained", root.id()), other);
        comments.setLike(root.id(), other, true);
        comments.deleteComment(root.id(), author);
        comments.deleteComment(root.id(), author);
        repository.flush();
        entities.clear();
        var response = comments.getComments(video, author);
        assertEquals(2, response.size());
        var deleted = response.getFirst();
        assertTrue(deleted.deleted());
        assertEquals("Comment deleted", deleted.text());
        assertFalse(deleted.canEdit());
        assertFalse(deleted.likedByMe());
        assertEquals(0, deleted.likesCount());
        assertEquals("", jdbc.queryForObject("select text from comments where id = ?", String.class, root.id()));
        assertEquals(root.id(), response.get(1).parentId());
        assertThrows(DeletedCommentException.class, () -> comments.addComment(video, request("bad", root.id()), author));
        assertThrows(DeletedCommentException.class, () -> comments.updateComment(root.id(), new UpdateCommentRequest("bad"), author));
        assertThrows(DeletedCommentException.class, () -> comments.setLike(root.id(), other, true));
        assertThrows(DeletedCommentException.class, () -> comments.setLike(root.id(), other, false));
        assertThrows(AccessDeniedException.class, () -> comments.deleteComment(root.id(), other));
        assertEquals(child.id(), comments.addComment(video, request("active child reply", child.id()), author).parentId());
        assertEquals(2, videos.getVideo(video).orElseThrow().commentsCount());
        assertEquals(2, videos.getAnalyticsForOwner(author, author).getFirst().commentsCount());
    }

    @Test
    void likesArePerUserIdempotentAndVisibleWithCallerState() {
        var root = comments.addComment(video, request("root", null), author);
        assertEquals(1, comments.setLike(root.id(), author, true).likesCount());
        assertEquals(1, comments.setLike(root.id(), author, true).likesCount());
        assertEquals(2, comments.setLike(root.id(), other, true).likesCount());
        var own = comments.getComments(video, author).getFirst();
        assertEquals(2, own.likesCount());
        assertTrue(own.likedByMe());
        assertFalse(comments.getComments(video, null).getFirst().likedByMe());
        assertEquals(1, comments.setLike(root.id(), author, false).likesCount());
        assertEquals(1, comments.setLike(root.id(), author, false).likesCount());
        assertTrue(comments.getComments(video, other).getFirst().likedByMe());
        assertFalse(comments.getComments(video, author).getFirst().likedByMe());
        assertEquals(0, comments.setLike(root.id(), other, false).likesCount());
        assertThrows(ResourceNotFoundException.class, () -> comments.setLike(root.id(), -1L, true));
    }

    private Long account() {
        String name = UUID.randomUUID().toString();
        return users.register(new RegisterRequest(name + "@example.test", name, "Test", "User", "password123")).id();
    }

    private CommentRequest request(String text, Long parent) {
        return new CommentRequest(text, parent);
    }
}
