-- 1. Changes to messages table
ALTER TABLE messages ADD COLUMN summary TEXT;
ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'chat';
ALTER TABLE messages ADD COLUMN importance INTEGER DEFAULT 0;

-- 2. New table chat_summaries
CREATE TABLE chat_summaries (
    id TEXT PRIMARY KEY, -- UUID as TEXT
    chat_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_message_ids TEXT NOT NULL, -- JSON array of UUIDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- 3. Indexes
CREATE INDEX idx_messages_chat_created ON messages (chat_id, created_at DESC);
CREATE INDEX idx_messages_type_importance ON messages (message_type, importance DESC);
CREATE INDEX idx_chat_summaries_chat ON chat_summaries (chat_id);

-- 4. Embedding Bridge
CREATE TABLE rag_entities (
    id TEXT PRIMARY KEY, -- UUID as TEXT
    entity_type TEXT NOT NULL, -- message | chat_summary
    entity_id TEXT NOT NULL, -- UUID as TEXT
    embedding_id TEXT, -- used when a vector exists in the DB
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
