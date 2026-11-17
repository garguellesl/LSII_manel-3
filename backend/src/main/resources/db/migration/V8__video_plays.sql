CREATE TABLE video_plays (
    id UUID PRIMARY KEY,
    video_id BIGINT NOT NULL,
    played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_video_plays_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX idx_video_plays_video ON video_plays(video_id);
