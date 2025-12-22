-- Redefine shortcuts table without Foreign Key to users
-- This is necessary because users might be stored remotely (Postgres) while shortcuts are local (SQLite),
-- and we don't sync users to the local database, causing FK violations.

CREATE TABLE shortcuts_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    keys TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, action)
);

INSERT INTO shortcuts_new (id, user_id, action, keys, created_at, updated_at)
SELECT id, user_id, action, keys, created_at, updated_at FROM shortcuts;

DROP TABLE shortcuts;

ALTER TABLE shortcuts_new RENAME TO shortcuts;

CREATE INDEX IF NOT EXISTS idx_shortcuts_user_id ON shortcuts(user_id);
