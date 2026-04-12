ALTER TABLE users
    ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark'
        CHECK (theme IN ('dark', 'light', 'industrial'));
