package com.tecnocampus.LS2.protube_back.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "comment_likes")
public class CommentLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    protected CommentLike() {
    }

    public CommentLike(Comment comment, UserAccount user) {
        this.comment = comment;
        this.user = user;
    }
}
