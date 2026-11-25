ALTER TABLE app_users ADD COLUMN preferred_language VARCHAR(2);
ALTER TABLE app_users ADD CONSTRAINT ck_user_preferred_language
    CHECK (preferred_language IN ('es', 'ca', 'en'));
