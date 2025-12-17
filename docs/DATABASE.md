# Database Schema and Migrations

Complete documentation of database schemas, migrations, and data models.

## Overview

Primer uses a dual-database architecture:
- **SQLite**: Local storage for chats and messages
- **PostgreSQL/Supabase**: User management and chat backup

## Database Selection

The application automatically detects the database type from the connection string:
- Starts with `postgres` → PostgreSQL repositories
- Otherwise → SQLite repositories

## Schema Overview

### Users Table (PostgreSQL/Supabase)

Stores user accounts and authentication data.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

**Fields**:
- `id`: Unique user identifier (UUID)
- `email`: User email address (unique, indexed)
- `password_hash`: Argon2 hashed password
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

---

### User API Keys Table (PostgreSQL/Supabase)

Stores API keys for AI providers.

```sql
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON user_api_keys(provider);
```

**Fields**:
- `id`: Unique API key identifier (UUID)
- `user_id`: Foreign key to users table
- `provider`: AI provider name ('openai', 'gemini')
- `api_key`: Encrypted API key value
- `created_at`: Creation timestamp

**Constraints**:
- One API key per provider per user (UNIQUE constraint)
- Cascade delete when user is deleted

---

### Chats Table (SQLite)

Local storage for chat conversations.

```sql
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
```

**Fields**:
- `id`: Chat identifier (UUID as TEXT)
- `user_id`: User identifier (UUID as TEXT)
- `title`: Optional chat title
- `created_at`: Creation timestamp (ISO 8601)
- `updated_at`: Last update timestamp (ISO 8601)

**Note**: SQLite uses TEXT for UUIDs and timestamps.

---

### Messages Table (SQLite)

Local storage for chat messages.

```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**Fields**:
- `id`: Message identifier (UUID as TEXT)
- `chat_id`: Foreign key to chats table
- `role`: Message role ('user', 'assistant', 'system')
- `content`: Message content
- `created_at`: Creation timestamp (ISO 8601)

**Constraints**:
- Cascade delete when chat is deleted

---

### Chats Table (PostgreSQL/Supabase)

Backup storage for chat conversations.

```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
```

**Fields**:
- `id`: Chat identifier (UUID)
- `user_id`: Foreign key to users table
- `title`: Optional chat title
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

---

### Messages Table (PostgreSQL/Supabase)

Backup storage for chat messages.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**Fields**:
- `id`: Message identifier (UUID)
- `chat_id`: Foreign key to chats table
- `role`: Message role ('user', 'assistant', 'system')
- `content`: Message content
- `created_at`: Creation timestamp

---

## Migrations

### Migration Files Location

- **PostgreSQL**: `backend/migrations/postgres/`
- **SQLite**: `backend/migrations/sqlite/`

### Running Migrations

#### PostgreSQL

```bash
cd backend
sqlx migrate run --database-url "$SUPABASE_CONNECTION_STRING"
```

#### SQLite

```bash
cd backend
sqlx migrate run --database-url "sqlite:./primer.db"
```

### Migration Naming

Migrations follow the pattern: `YYYYMMDDHHMMSS_description.sql`

Example: `20241203000000_initial_schema.sql`

---

## Data Models

### User Entity

```rust
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

### UserApiKey Entity

```rust
pub struct UserApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub provider: String,  // "openai", "gemini"
    pub api_key: String,   // Encrypted
    pub created_at: DateTime<Utc>,
}
```

### Chat Entity

```rust
pub struct Chat {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

### Message Entity

```rust
pub struct Message {
    pub id: Uuid,
    pub chat_id: Uuid,
    pub role: String,      // "user", "assistant", "system"
    pub content: String,
    pub created_at: DateTime<Utc>,
}
```

---

## Data Flow

### User Registration Flow

```
Frontend → Register Command
  ↓
RegisterUseCase
  ↓
UserRepository (Postgres)
  ↓
users table
```

### Chat Creation Flow

```
Frontend → Create Chat Command
  ↓
CreateChatUseCase
  ↓
ChatRepository (SQLite)
  ↓
chats table (SQLite)
```

### Message Sending Flow

```
Frontend → Send Message Command
  ↓
SendMessageUseCase
  ↓
ChatService
  ├── Save user message → messages table (SQLite)
  ├── Fetch context → messages table (SQLite)
  ├── Call AI provider
  └── Save AI response → messages table (SQLite)
```

### Backup Flow

```
Frontend → Backup Chat Command
  ↓
BackupChatUseCase
  ├── Fetch chat → chats table (SQLite)
  ├── Create/update → chats table (Postgres)
  ├── Fetch messages → messages table (SQLite)
  └── Insert new → messages table (Postgres)
```

---

## Indexes

### Performance Optimization

Indexes are created on:
- `users.email` - Fast email lookups
- `user_api_keys.user_id` - Fast API key retrieval
- `chats.user_id` - Fast chat listing
- `messages.chat_id` - Fast message retrieval
- `messages.created_at` - Chronological ordering

### Query Patterns

**Find user by email**:
```sql
SELECT * FROM users WHERE email = $1;
-- Uses idx_users_email
```

**Get user's API keys**:
```sql
SELECT * FROM user_api_keys WHERE user_id = $1;
-- Uses idx_user_api_keys_user_id
```

**Get chat messages**:
```sql
SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at;
-- Uses idx_messages_chat_id and idx_messages_created_at
```

---

## Data Integrity

### Foreign Key Constraints

- `user_api_keys.user_id` → `users.id` (CASCADE DELETE)
- `chats.user_id` → `users.id` (CASCADE DELETE, Postgres only)
- `messages.chat_id` → `chats.id` (CASCADE DELETE)

### Unique Constraints

- `users.email` - One account per email
- `(user_api_keys.user_id, user_api_keys.provider)` - One API key per provider per user

### Cascade Deletes

- Deleting a user deletes all their API keys
- Deleting a chat deletes all its messages
- Deleting a user deletes all their chats (Postgres only)

---

## Backup and Sync Strategy

### Local-First Architecture

1. **Primary Storage**: SQLite (local, fast, offline-capable)
2. **Backup Storage**: PostgreSQL/Supabase (cloud, persistent)

### Sync Process

1. User creates chat locally (SQLite)
2. User sends messages locally (SQLite)
3. User triggers backup → Syncs to Supabase
4. Messages are synced by ID to avoid duplicates

### Conflict Resolution

- **Chats**: Update Postgres with latest SQLite data
- **Messages**: Only insert new messages (by ID)
- **No Updates**: Messages are immutable (new messages get new IDs)

---

## Security Considerations

### Password Storage

- Passwords are hashed with Argon2
- Never stored in plain text
- Hash includes salt automatically

### API Key Storage

- API keys stored in database
- Should be encrypted at rest (application-level)
- Never logged or exposed in responses

### Data Isolation

- Users can only access their own data
- Foreign key constraints enforce referential integrity
- Cascade deletes prevent orphaned records

---

## Maintenance

### Regular Tasks

1. **Backup Database**: Regular backups of both SQLite and Postgres
2. **Vacuum SQLite**: Periodically run `VACUUM` on SQLite database
3. **Analyze Postgres**: Run `ANALYZE` to update statistics
4. **Monitor Size**: Track database growth

### SQLite Maintenance

```sql
-- Vacuum database
VACUUM;

-- Check database size
SELECT page_count * page_size as size_bytes 
FROM pragma_page_count(), pragma_page_size();
```

### PostgreSQL Maintenance

```sql
-- Analyze tables
ANALYZE users;
ANALYZE user_api_keys;
ANALYZE chats;
ANALYZE messages;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Migration Best Practices

1. **Always Backup**: Backup database before running migrations
2. **Test First**: Test migrations on development database
3. **Version Control**: Keep all migrations in version control
4. **Rollback Plan**: Have rollback strategy for production
5. **Document Changes**: Document schema changes in migration comments

---

## Future Schema Changes

Potential additions:

- **chat_settings**: Per-chat configuration (model, temperature, etc.)
- **message_attachments**: Support for file attachments
- **chat_tags**: Tagging system for chats
- **user_preferences**: User-specific settings
- **audit_log**: Audit trail for sensitive operations
