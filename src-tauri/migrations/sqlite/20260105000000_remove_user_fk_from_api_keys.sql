-- Create new table without Foreign Key
CREATE TABLE user_api_keys_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    selected_model TEXT,
    UNIQUE(user_id, provider)
);

-- Copy data
INSERT INTO user_api_keys_new (id, user_id, provider, api_key, created_at, selected_model)
SELECT id, user_id, provider, api_key, created_at, selected_model FROM user_api_keys;

-- Drop old table
DROP TABLE user_api_keys;

-- Rename new table
ALTER TABLE user_api_keys_new RENAME TO user_api_keys;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id_provider ON user_api_keys(user_id, provider);
