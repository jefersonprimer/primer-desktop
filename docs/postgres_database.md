# PostgreSQL/Supabase Database Schema

Complete documentation of the PostgreSQL database schema used for Supabase cloud storage.

## Overview

The PostgreSQL database stores:
- **Users**: User accounts and authentication data
- **User API Keys**: API keys for AI providers (OpenAI, Gemini, Claude)
- **Chats**: Backup copies of chat conversations (synced from SQLite)
- **Messages**: Backup copies of chat messages (synced from SQLite)

## Schema

### Users Table

Stores user accounts and authentication information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id` (UUID): Primary key, auto-generated UUID
- `email` (VARCHAR(255)): User email address, unique and indexed
- `password_hash` (TEXT): Argon2 hashed password
- `created_at` (TIMESTAMP WITH TIME ZONE): Account creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE): Last update timestamp

**Indexes**:
- `idx_users_email`: Fast email lookups
- `idx_users_created_at`: For querying recently created users

---

### User API Keys Table

Stores API keys for AI providers (OpenAI, Gemini, Claude).

```sql
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    api_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);
```

**Columns**:
- `id` (UUID): Primary key, auto-generated UUID
- `user_id` (UUID): Foreign key to `users.id`, cascade delete
- `provider` (VARCHAR(50)): AI provider name ('openai', 'gemini', 'claude_code')
- `api_key` (TEXT): Encrypted API key value
- `created_at` (TIMESTAMP WITH TIME ZONE): Creation timestamp

**Constraints**:
- `UNIQUE(user_id, provider)`: One API key per provider per user
- Foreign key with `ON DELETE CASCADE`: Deleting a user deletes their API keys

**Indexes**:
- `idx_user_api_keys_user_id`: Fast lookups by user
- `idx_user_api_keys_provider`: Fast lookups by provider
- `idx_user_api_keys_user_id_provider`: Composite index for common queries

---

### Chats Table

Stores backup copies of chat conversations synced from SQLite.

```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id` (UUID): Primary key, matches SQLite chat ID
- `user_id` (UUID): Foreign key to `users.id`, cascade delete
- `title` (VARCHAR(255)): Optional chat title
- `created_at` (TIMESTAMP WITH TIME ZONE): Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE): Last update timestamp

**Constraints**:
- Foreign key with `ON DELETE CASCADE`: Deleting a user deletes their chats

**Indexes**:
- `idx_chats_user_id`: Fast lookups by user
- `idx_chats_user_id_updated_at`: Composite index for listing user's chats (most recent first)
- `idx_chats_created_at`: For querying chats by creation date

---

### Messages Table

Stores backup copies of chat messages synced from SQLite.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id` (UUID): Primary key, matches SQLite message ID
- `chat_id` (UUID): Foreign key to `chats.id`, cascade delete
- `role` (VARCHAR(20)): Message role ('user', 'assistant', 'system')
- `content` (TEXT): Message content
- `created_at` (TIMESTAMP WITH TIME ZONE): Creation timestamp

**Constraints**:
- Foreign key with `ON DELETE CASCADE`: Deleting a chat deletes its messages

**Indexes**:
- `idx_messages_chat_id`: Fast lookups by chat
- `idx_messages_chat_id_created_at`: Composite index for chronological message ordering
- `idx_messages_created_at`: For querying messages by creation date

---

## Data Flow

### User Registration

```
Frontend → Register Command → RegisterUseCase → UserRepository → users table
```

### API Key Management

```
Frontend → Add API Key Command → AddApiKeyUseCase → UserApiKeyRepository → user_api_keys table
```

### Chat Backup

```
SQLite (local) → Backup Chat Command → BackupChatUseCase → PostgresChatRepository → chats table
SQLite (local) → Backup Chat Command → BackupChatUseCase → PostgresMessageRepository → messages table
```

### Message Sync

```
SQLite (local) → Sync Messages Command → SyncMessagesUseCase → PostgresMessageRepository → messages table
```

---

## Query Patterns

### Find User by Email

```sql
SELECT * FROM users WHERE email = $1;
-- Uses idx_users_email
```

### Get User's API Keys

```sql
SELECT * FROM user_api_keys WHERE user_id = $1;
-- Uses idx_user_api_keys_user_id
```

### Get User's API Key for Provider

```sql
SELECT * FROM user_api_keys WHERE user_id = $1 AND provider = $2;
-- Uses idx_user_api_keys_user_id_provider
```

### List User's Chats (Most Recent First)

```sql
SELECT * FROM chats WHERE user_id = $1 ORDER BY updated_at DESC;
-- Uses idx_chats_user_id_updated_at
```

### Get Chat Messages (Chronological)

```sql
SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC;
-- Uses idx_messages_chat_id_created_at
```

---

## Constraints and Relationships

### Foreign Key Relationships

```
users (1) ──→ (N) user_api_keys
users (1) ──→ (N) chats
chats (1) ──→ (N) messages
```

### Cascade Deletes

- Deleting a user automatically deletes:
  - All their API keys
  - All their chats
  - All messages in their chats

- Deleting a chat automatically deletes:
  - All messages in that chat

### Unique Constraints

- `users.email`: One account per email address
- `user_api_keys(user_id, provider)`: One API key per provider per user

---

## Migration

The schema is created via migration file:
`backend/migrations/postgres/20241203000000_initial_schema.sql`

To run migrations:
```bash
sqlx migrate run --database-url "$SUPABASE_CONNECTION_STRING"
```

---

## Notes

1. **UUID Type**: PostgreSQL uses native UUID type for better performance and type safety
2. **Time Zones**: All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
3. **Text vs VARCHAR**: `content` uses TEXT for unlimited length, other fields use VARCHAR for constraints
4. **Cascade Deletes**: Ensures data integrity when users or chats are deleted
5. **Indexes**: All foreign keys and commonly queried columns are indexed for performance

---

## Backup Strategy

- **Primary Storage**: SQLite (local, fast, offline-capable)
- **Backup Storage**: PostgreSQL/Supabase (cloud, persistent)
- **Sync Process**: User triggers backup, which syncs chats and messages
- **Conflict Resolution**: Messages synced by ID to avoid duplicates

---

## Security Considerations

1. **Password Storage**: Passwords are hashed with Argon2 before storage
2. **API Keys**: Should be encrypted at application level (not shown in schema)
3. **Data Isolation**: Foreign keys ensure users can only access their own data
4. **Cascade Deletes**: Prevents orphaned records

---

## Maintenance

### Analyze Tables

```sql
ANALYZE users;
ANALYZE user_api_keys;
ANALYZE chats;
ANALYZE messages;
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum

```sql
VACUUM ANALYZE users;
VACUUM ANALYZE user_api_keys;
VACUUM ANALYZE chats;
VACUUM ANALYZE messages;
```
