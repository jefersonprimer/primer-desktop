-- Session table (Always 1 row, stores tokens locally)
CREATE TABLE IF NOT EXISTS session (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    user_id TEXT NOT NULL,             -- uuid vindo do Supabase
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at INTEGER NOT NULL        -- epoch timestamp
);

-- Users table (Note: SQLite doesn't have native UUID type, so we use TEXT)
-- Users are stored in Postgres/Supabase, but this table exists for local development/testing
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,          -- UUID as TEXT (SQLite doesn't have UUID type)
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- User API Keys table (Note: API keys are stored in Postgres/Supabase, not SQLite)
-- This table exists for local development/testing only
CREATE TABLE IF NOT EXISTS user_api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,       -- "openai", "gemini", "claude_code"
    api_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, provider)
);

-- Indexes for API key lookups
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id_provider ON user_api_keys(user_id, provider);

-- Chats table (Primary storage in SQLite for local chats)
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,          -- UUID as TEXT
    user_id TEXT NOT NULL,        -- UUID as TEXT (references user in Postgres, not local)
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chat lookups
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id_updated_at ON chats(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);

-- Messages table (Primary storage in SQLite for local messages)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,          -- UUID as TEXT
    chat_id TEXT NOT NULL,        -- UUID as TEXT
    role TEXT NOT NULL,           -- "user", "assistant", or "system"
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Indexes for message lookups
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
