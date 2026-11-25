ALTER TABLE videos ADD COLUMN audience VARCHAR(16) NOT NULL DEFAULT 'UNCLASSIFIED'
    CHECK (audience IN ('UNCLASSIFIED', 'CHILDREN', 'NOT_CHILDREN'));
CREATE INDEX idx_watch_history_recent ON watch_history (user_id, watched_at DESC, id DESC);
