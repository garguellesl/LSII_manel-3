ALTER TABLE videos ADD COLUMN tags_initialized BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE videos SET tags_initialized = TRUE
WHERE EXISTS (SELECT 1 FROM video_tags WHERE video_tags.video_id = videos.id);
