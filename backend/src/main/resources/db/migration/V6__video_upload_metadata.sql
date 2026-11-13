-- Existing rows retain their identity, paths and activity; their origin is unclassified.
ALTER TABLE videos ADD COLUMN category VARCHAR(40);
ALTER TABLE videos ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'LEGACY';
ALTER TABLE videos ADD CONSTRAINT videos_source_check CHECK (source IN ('LEGACY', 'IMPORTED', 'UPLOAD'));
ALTER TABLE videos ADD CONSTRAINT videos_upload_category_check CHECK (source <> 'UPLOAD' OR (category IS NOT NULL AND category IN
    ('Music', 'Gaming', 'Education', 'Technology', 'Entertainment', 'Sports', 'Other')));
