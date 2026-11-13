ALTER TABLE video_likes
    ADD COLUMN reaction_type VARCHAR(10) NOT NULL DEFAULT 'LIKE';

ALTER TABLE video_likes
    ADD CONSTRAINT ck_video_likes_reaction_type CHECK (reaction_type IN ('LIKE', 'DISLIKE'));

CREATE INDEX idx_video_likes_video_reaction ON video_likes(video_id, reaction_type);
