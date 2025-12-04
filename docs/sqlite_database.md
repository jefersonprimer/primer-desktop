# SQLite Database Schema

Complete documentation of the SQLite database schema used for local chat storage.

## Overview

The SQLite database stores:
- **Users**: User accounts (for local development/testing, primary storage is Postgres)
- **User API Keys**: API keys (for local development/testing, primary storage is Postgres)
- **Chats**: Primary storage for chat conversations (local-first)
- **Messages**: Primary storage for chat messages (local-first)

## Important Notes

1. **SQLite Limitations**: SQLite doesn't have native UUID type, so UUIDs are stored as TEXT
2. **Primary Storage**: Chats and messages are primarily stored in SQLite for fast, local access
3. **User Storage**: Users and API keys are primarily stored in Postgres/Supabase, SQLite tables exist for local development
4. **Backup**: Chats and messages can be synced to Postgres/Supabase via backup commands

## Schema

### Users Table

Stores user accounts (primarily for local development/testing).

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,          -- UUID as TEXT (SQLite doesn't have UUID type)
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id` (TEXT): Primary key, UUID stored as text string
- `email` (TEXT): User email address, unique and indexed
- `password_hash` (TEXT): Argon2 hashed password
- `created_at` (DATETIME): Account creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Indexes**:
- `idx_users_email`: Fast email lookups
- `idx_users_created_at`: For querying recently created users

**Note**: In production, users are stored in Postgres/Supabase, not SQLite.

---

### User API Keys Table

Stores API keys for AI providers (primarily for local development/testing).

```sql
CREATE TABLE user_api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,       -- "openai", "gemini", "claude_code"
    api_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, provider)
);
```

**Columns**:
- `id` (TEXT): Primary key, UUID stored as text string
- `user_id` (TEXT): Foreign key to `users.id`, cascade delete
- `provider` (TEXT): AI provider name ('openai', 'gemini', 'claude_code')
- `api_key` (TEXT): Encrypted API key value
- `created_at` (DATETIME): Creation timestamp

**Constraints**:
- `UNIQUE(user_id, provider)`: One API key per provider per user
- Foreign key with `ON DELETE CASCADE`: Deleting a user deletes their API keys

**Indexes**:
- `idx_user_api_keys_user_id`: Fast lookups by user
- `idx_user_api_keys_provider`: Fast lookups by provider
- `idx_user_api_keys_user_id_provider`: Composite index for common queries

**Note**: In production, API keys are stored in Postgres/Supabase, not SQLite.

---

### Chats Table

Primary storage for chat conversations (local-first architecture).

```sql
CREATE TABLE chats (
    id TEXT PRIMARY KEY,          -- UUID as TEXT
    user_id TEXT NOT NULL,        -- UUID as TEXT (references user in Postgres, not local)
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id` (TEXT): Primary key, UUID stored as text string
- `user_id` (TEXT): User identifier (references user in Postgres, not a foreign key in SQLite)
- `title` (TEXT): Optional chat title
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Indexes**:
- `idx_chats_user_id`: Fast lookups by user
- `idx_chats_user_id_updated_at`: Composite index for listing user's chats (most recent first)
- `idx_chats_created_at`: For querying chats by creation date

**Note**: 
- This is the primary storage location for chats
- Chats can be backed up to Postgres/Supabase
- `user_id` is not a foreign key because users are stored in Postgres

---

### Messages Table

Primary storage for chat messages (local-first architecture).

```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,          -- UUID as TEXT
    chat_id TEXT NOT NULL,        -- UUID as TEXT
    role TEXT NOT NULL,           -- "user", "assistant", or "system"
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
```

**Columns**:
- `id` (TEXT): Primary key, UUID stored as text string
- `chat_id` (TEXT): Foreign key to `chats.id`, cascade delete
- `role` (TEXT): Message role ('user', 'assistant', 'system')
- `content` (TEXT): Message content
- `created_at` (DATETIME): Creation timestamp

**Constraints**:
- Foreign key with `ON DELETE CASCADE`: Deleting a chat deletes its messages

**Indexes**:
- `idx_messages_chat_id`: Fast lookups by chat
- `idx_messages_chat_id_created_at`: Composite index for chronological message ordering
- `idx_messages_created_at`: For querying messages by creation date

**Note**: 
- This is the primary storage location for messages
- Messages can be synced to Postgres/Supabase
- Messages are fetched in chronological order for conversation context

---

## Data Flow

### Chat Creation

```
Frontend → Create Chat Command → CreateChatUseCase → SqliteChatRepository → chats table
```

### Message Sending

```
Frontend → Send Message Command → SendMessageUseCase → ChatService → SqliteMessageRepository → messages table
```

### Chat Backup

```
SQLite chats → Backup Chat Command → BackupChatUseCase → PostgresChatRepository → Postgres chats table
SQLite messages → Backup Chat Command → BackupChatUseCase → PostgresMessageRepository → Postgres messages table
```

### Message Sync

```
SQLite messages → Sync Messages Command → SyncMessagesUseCase → PostgresMessageRepository → Postgres messages table
```

---

## Query Patterns

### Find Chat by ID

```sql
SELECT * FROM chats WHERE id = ?;
-- Uses PRIMARY KEY index
```

### List User's Chats (Most Recent First)

```sql
SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC;
-- Uses idx_chats_user_id_updated_at
```

### Get Chat Messages (Chronological)

```sql
SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC;
-- Uses idx_messages_chat_id_created_at
```

### Count Messages in Chat

```sql
SELECT COUNT(*) FROM messages WHERE chat_id = ?;
-- Uses idx_messages_chat_id
```

---

## Constraints and Relationships

### Foreign Key Relationships

```
chats (1) ──→ (N) messages
```

**Note**: `user_id` in chats table is not a foreign key because users are stored in Postgres, not SQLite.

### Cascade Deletes

- Deleting a chat automatically deletes all its messages

### Unique Constraints

- `users.email`: One account per email address
- `user_api_keys(user_id, provider)`: One API key per provider per user

---

## Migration

The schema is created via migration file:
`backend/migrations/sqlite/20241203000000_initial_schema.sql`

To run migrations:
```bash
sqlx migrate run --database-url "sqlite:./primer.db"
```

---

## SQLite-Specific Considerations

### UUID Storage

SQLite doesn't have a native UUID type, so UUIDs are stored as TEXT:
- Format: `550e8400-e29b-41d4-a716-446655440000`
- Conversion handled by Rust code (UUID ↔ TEXT)

### Timestamps

SQLite uses `DATETIME` for timestamps:
- Format: ISO 8601 strings (e.g., `2024-01-15 10:30:00`)
- Conversion handled by Rust code (DateTime<Utc> ↔ DATETIME)

### Foreign Keys

Foreign keys must be enabled:
```sql
PRAGMA foreign_keys = ON;
```

This is typically handled by the SQLx library automatically.

### Text vs VARCHAR

SQLite treats TEXT and VARCHAR the same, so we use TEXT for consistency.

---

## Performance Optimization

### Indexes

All foreign keys and commonly queried columns are indexed:
- Foreign keys: `chat_id`, `user_id`
- Query patterns: `user_id + updated_at`, `chat_id + created_at`
- Single columns: `email`, `provider`, `created_at`

### Vacuum

Periodically run VACUUM to reclaim space:
```sql
VACUUM;
```

### Analyze

Update query planner statistics:
```sql
ANALYZE;
```

---

## Backup Strategy

### Local-First Architecture

1. **Primary Storage**: SQLite (local, fast, offline-capable)
2. **Backup Storage**: PostgreSQL/Supabase (cloud, persistent)
3. **Sync Process**: User triggers backup via `backup_chat` command
4. **Conflict Resolution**: Messages synced by ID to avoid duplicates

### Backup Flow

```
1. User creates chat locally (SQLite)
2. User sends messages locally (SQLite)
3. User triggers backup → Syncs to Supabase
4. Messages are synced by ID to avoid duplicates
```

---

## Maintenance

### Check Database Size

```sql
SELECT page_count * page_size as size_bytes 
FROM pragma_page_count(), pragma_page_size();
```

### Vacuum Database

```sql
VACUUM;
```

### Analyze Tables

```sql
ANALYZE;
```

### Check Foreign Key Status

```sql
PRAGMA foreign_keys;
```

---

## Security Considerations

1. **Password Storage**: Passwords are hashed with Argon2 before storage
2. **API Keys**: Should be encrypted at application level (not shown in schema)
3. **Data Isolation**: Application logic ensures users can only access their own data
4. **Cascade Deletes**: Prevents orphaned records

---

## Development vs Production

### Development

- SQLite can be used for all tables (users, API keys, chats, messages)
- Useful for offline development and testing

### Production

- **Users & API Keys**: Stored in Postgres/Supabase
- **Chats & Messages**: Stored in SQLite (local-first)
- **Backup**: Chats and messages synced to Postgres/Supabase on demand

---

## Troubleshooting

### Foreign Keys Not Working

```sql
PRAGMA foreign_keys = ON;
```

### Database Locked

- Ensure all connections are closed
- Check for long-running transactions

### Performance Issues

- Run `VACUUM` to reclaim space
- Run `ANALYZE` to update statistics
- Check that indexes are being used: `EXPLAIN QUERY PLAN SELECT ...`
