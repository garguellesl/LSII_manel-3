package com.tecnocampus.LS2.protube_back.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VideoLikeTest {
    @Test
    void reactionDefaultsToLikeAndCanSwitchToDislike() {
        VideoLike reaction = new VideoLike(null, null);
        assertEquals(VideoLike.ReactionType.LIKE, reaction.getReactionType());
        reaction.setReactionType(VideoLike.ReactionType.DISLIKE);
        assertEquals(VideoLike.ReactionType.DISLIKE, reaction.getReactionType());
    }
}
