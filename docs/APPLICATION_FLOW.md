# Primer Application Flow

Complete end-to-end flow of the Primer application, from user registration to email summary.

## Overview

This document traces the complete user journey through the Primer application, including all interactions with the backend, database operations, and external services.

---

## 1. User Registration

### Flow Diagram

```
Frontend (React)
  ↓ User fills registration form
  ↓ invoke('register', { email, password })
Tauri Command (register)
  ↓ Validates UUID format (if needed)
  ↓ Creates RegisterUseCase
RegisterUseCase
  ↓ Checks if email exists (UserRepository.find_by_email)
  ↓ Hashes password (Argon2PasswordHasher)
  ↓ Creates User entity
  ↓ Saves to database (UserRepository.create)
PostgreSQL/Supabase
  ↓ INSERT INTO users (id, email, password_hash, ...)
  ↓ Returns created user
RegisterUseCase
  ↓ Returns User entity
Tauri Command
  ↓ Returns { message: "User registered successfully" }
Frontend
  ↓ Shows success message
  ↓ Redirects to login
```

### Detailed Steps

1. **User Action**: User enters email and password in registration form
2. **Frontend Call**:
   ```typescript
   await invoke('register', {
     dto: {
       email: 'user@example.com',
       password: 'securePassword123'
     }
   });
   ```

3. **Backend Processing**:
   - `RegisterUseCase` checks if email already exists
   - If exists → Error: "Email already registered"
   - If not → Password is hashed with Argon2
   - New `User` entity created with:
     - `id`: Generated UUID
     - `email`: User's email
     - `password_hash`: Argon2 hash
     - `created_at`: Current timestamp
     - `updated_at`: Current timestamp

4. **Database Operation**:
   ```sql
   INSERT INTO users (id, email, password_hash, created_at, updated_at)
   VALUES (uuid, 'user@example.com', 'argon2hash...', now(), now())
   ```
   - Stored in **PostgreSQL/Supabase** (not SQLite)

5. **Response**: Success message returned to frontend

---

## 2. User Login

### Flow Diagram

```
Frontend
  ↓ User enters email/password
  ↓ invoke('login', { email, password })
Tauri Command (login)
  ↓ Creates LoginUseCase
LoginUseCase
  ↓ Finds user by email (UserRepository.find_by_email)
  ↓ Verifies password (Argon2PasswordHasher.verify)
  ↓ Generates JWT token (JwtTokenGenerator)
  ↓ Returns token
Tauri Command
  ↓ Returns { token: "eyJhbGci..." }
Frontend
  ↓ Stores token in localStorage
  ↓ User is now authenticated
```

### Detailed Steps

1. **User Action**: User enters email and password
2. **Frontend Call**:
   ```typescript
   const result = await invoke('login', {
     dto: {
       email: 'user@example.com',
       password: 'securePassword123'
     }
   });
   // result.token contains JWT
   localStorage.setItem('auth_token', result.token);
   ```

3. **Backend Processing**:
   - `LoginUseCase` finds user by email in PostgreSQL
   - Verifies password hash matches using Argon2
   - If invalid → Error: "Invalid email or password"
   - If valid → Generates JWT token with:
     - User ID in payload
     - Expiration time (from config)
     - Signed with JWT_SECRET

4. **Database Operation**:
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com'
   ```
   - Query from **PostgreSQL/Supabase**

5. **Response**: JWT token returned, stored in frontend

---

## 3. Adding API Keys

### Flow Diagram

```
Frontend
  ↓ User enters API key for provider (e.g., OpenAI)
  ↓ invoke('add_api_key', { user_id, provider, api_key })
Tauri Command (add_api_key)
  ↓ Validates provider name
  ↓ Creates AddApiKeyUseCase
AddApiKeyUseCase
  ↓ Validates provider ('openai', 'gemini', 'claude_code')
  ↓ Checks if user already has key for this provider
  ↓ Creates UserApiKey entity
  ↓ Saves to database
PostgreSQL/Supabase
  ↓ INSERT INTO user_api_keys (id, user_id, provider, api_key, ...)
  ↓ UNIQUE constraint ensures one key per provider per user
Tauri Command
  ↓ Returns { message: "API key added successfully" }
Frontend
  ↓ Updates UI to show API key is configured
```

### Detailed Steps

1. **User Action**: User navigates to settings, enters API key for a provider
2. **Frontend Call**:
   ```typescript
   await invoke('add_api_key', {
     dto: {
       user_id: '550e8400-e29b-41d4-a716-446655440000',
       provider: 'openai',
       api_key: 'sk-...'
     }
   });
   ```

3. **Backend Processing**:
   - `AddApiKeyUseCase` validates provider name
   - Checks existing keys for this user/provider combination
   - If exists → Error: "User already has an API key for this provider"
   - If not → Creates `UserApiKey` entity:
     - `id`: Generated UUID
     - `user_id`: User's UUID
     - `provider`: 'openai', 'gemini', or 'claude_code'
     - `api_key`: Raw API key (should be encrypted in production)
     - `created_at`: Current timestamp

4. **Database Operation**:
   ```sql
   INSERT INTO user_api_keys (id, user_id, provider, api_key, created_at)
   VALUES (uuid, user_uuid, 'openai', 'sk-...', now())
   ```
   - Stored in **PostgreSQL/Supabase**
   - `UNIQUE(user_id, provider)` constraint prevents duplicates

5. **Response**: Success message, UI updated

---

## 4. Creating a Chat

### Flow Diagram

```
Frontend
  ↓ User clicks "New Chat"
  ↓ invoke('create_chat', { user_id, title })
Tauri Command (create_chat)
  ↓ Creates CreateChatUseCase
CreateChatUseCase
  ↓ Creates Chat entity
  ↓ Saves to SQLite (local storage)
SQLite Database
  ↓ INSERT INTO chats (id, user_id, title, created_at, updated_at)
  ↓ Chat stored locally
Tauri Command
  ↓ Returns { chat_id: "770e8400-..." }
Frontend
  ↓ Opens new chat interface
  ↓ Ready for messages
```

### Detailed Steps

1. **User Action**: User clicks "New Chat" button
2. **Frontend Call**:
   ```typescript
   const result = await invoke('create_chat', {
     dto: {
       user_id: '550e8400-e29b-41d4-a716-446655440000',
       title: 'My First Chat' // Optional
     }
   });
   // result.chat_id contains the new chat ID
   ```

3. **Backend Processing**:
   - `CreateChatUseCase` creates `Chat` entity:
     - `id`: Generated UUID
     - `user_id`: User's UUID
     - `title`: Optional chat title
     - `created_at`: Current timestamp
     - `updated_at`: Current timestamp

4. **Database Operation**:
   ```sql
   INSERT INTO chats (id, user_id, title, created_at, updated_at)
   VALUES ('770e8400-...', '550e8400-...', 'My First Chat', datetime('now'), datetime('now'))
   ```
   - Stored in **SQLite** (local database)
   - This is the primary storage location

5. **Response**: Chat ID returned, frontend opens chat interface

---

## 5. Sending a Message

### Flow Diagram

```
Frontend
  ↓ User types message and clicks "Send"
  ↓ invoke('send_message', { user_id, chat_id, content, provider_name, model, ... })
Tauri Command (send_message)
  ↓ Creates SendMessageUseCase
SendMessageUseCase
  ↓ Creates ChatServiceRequest
  ↓ Calls ChatService.send_message_to_ai
ChatServiceImpl
  ├─ Step 1: Get user's API key
  │   ↓ UserApiKeyRepository.find_by_user_id(user_id)
  │   ↓ Filters by provider_name
  │   ↓ Extracts api_key
  │
  ├─ Step 2: Save user's message
  │   ↓ Creates Message entity (role: "user")
  │   ↓ MessageRepository.create (SQLite)
  │   ↓ INSERT INTO messages (id, chat_id, role, content, created_at)
  │
  ├─ Step 3: Fetch conversation context
  │   ↓ MessageRepository.find_by_chat_id(chat_id)
  │   ↓ SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC
  │   ↓ Gets ALL previous messages (including the one just saved)
  │
  ├─ Step 4: Prepare AI request
  │   ↓ Converts messages to ChatMessage format
  │   ↓ Creates ChatCompletionRequest with full context
  │
  ├─ Step 5: Call AI provider
  │   ↓ Selects provider (OpenAI, Gemini, or Claude)
  │   ↓ Makes HTTP request to AI API
  │   ↓ Uses user's API key for authentication
  │   ↓ AI processes request with full conversation context
  │   ↓ Returns response
  │
  └─ Step 6: Save AI response
      ↓ Creates Message entity (role: "assistant")
      ↓ MessageRepository.create (SQLite)
      ↓ INSERT INTO messages (id, chat_id, role, content, created_at)
      ↓ Returns Message entity

Tauri Command
  ↓ Returns { message: { id, chat_id, role, content, created_at } }
Frontend
  ↓ Displays AI response in chat
  ↓ Conversation continues...
```

### Detailed Steps

1. **User Action**: User types a message and clicks "Send"

2. **Frontend Call**:
   ```typescript
   const result = await invoke('send_message', {
     dto: {
       user_id: '550e8400-e29b-41d4-a716-446655440000',
       chat_id: '770e8400-e29b-41d4-a716-446655440000',
       content: 'What is the capital of France?',
       provider_name: 'openai',
       model: 'gpt-4',
       temperature: 0.7,
       max_tokens: 1000
     }
   });
   ```

3. **Backend Processing - Step by Step**:

   **Step 1: Get API Key**
   ```rust
   // ChatServiceImpl retrieves user's API key
   let user_api_keys = user_api_key_repo.find_by_user_id(user_id).await?;
   let api_key = user_api_keys
       .iter()
       .find(|key| key.provider == "openai")
       .ok_or("API key not found")?;
   ```
   - Queries **PostgreSQL/Supabase** for user's API keys
   - Filters by provider name

   **Step 2: Save User Message**
   ```rust
   let user_message = Message {
       id: Uuid::new_v4(),
       chat_id: chat_id,
       role: "user".to_string(),
       content: "What is the capital of France?",
       created_at: Utc::now(),
   };
   message_repo.create(user_message).await?;
   ```
   - Saves to **SQLite** immediately
   - This ensures user's message is stored before AI call

   **Step 3: Fetch Conversation Context**
   ```rust
   let previous_messages = message_repo.find_by_chat_id(chat_id).await?;
   // Returns ALL messages including the one just saved
   ```
   - Queries **SQLite** for all messages in this chat
   - Orders by `created_at ASC` for chronological order
   - Includes the user message just saved

   **Step 4: Prepare AI Request**
   ```rust
   let chat_messages: Vec<ChatMessage> = previous_messages
       .iter()
       .map(|msg| ChatMessage {
           role: msg.role.clone(),
           content: msg.content.clone(),
       })
       .collect();
   
   let chat_req = ChatCompletionRequest {
       model: "gpt-4".to_string(),
       messages: chat_messages, // Full conversation history
       temperature: Some(0.7),
       max_tokens: Some(1000),
   };
   ```
   - Converts all messages to AI provider format
   - Includes full conversation context

   **Step 5: Call AI Provider**
   ```rust
   // Example for OpenAI
   let ai_response = openai_provider
       .chat_completion(api_key, chat_req)
       .await?;
   ```
   - Makes HTTP POST request to AI provider API
   - Includes full conversation history
   - AI processes with context and generates response
   - Returns structured response

   **Step 6: Save AI Response**
   ```rust
   let ai_message = Message {
       id: Uuid::new_v4(),
       chat_id: chat_id,
       role: "assistant".to_string(),
       content: ai_response.content,
       created_at: Utc::now(),
   };
   message_repo.create(ai_message).await?;
   ```
   - Saves AI response to **SQLite**
   - Returns message entity

4. **Database Operations**:
   ```sql
   -- Save user message
   INSERT INTO messages (id, chat_id, role, content, created_at)
   VALUES ('msg1-uuid', 'chat-uuid', 'user', 'What is the capital of France?', datetime('now'));
   
   -- Fetch context (returns all messages including the one above)
   SELECT * FROM messages WHERE chat_id = 'chat-uuid' ORDER BY created_at ASC;
   
   -- Save AI response
   INSERT INTO messages (id, chat_id, role, content, created_at)
   VALUES ('msg2-uuid', 'chat-uuid', 'assistant', 'The capital of France is Paris.', datetime('now'));
   ```
   - All operations on **SQLite** (local storage)

5. **Response**: AI message returned to frontend, displayed in chat

---

## 6. Backing Up a Chat (Optional)

### Flow Diagram

```
Frontend
  ↓ User clicks "Backup Chat" button
  ↓ invoke('backup_chat', { user_id, chat_id })
Tauri Command (backup_chat)
  ↓ Creates BackupChatUseCase
BackupChatUseCase
  ├─ Step 1: Verify chat exists and belongs to user
  │   ↓ SqliteChatRepository.find_by_id(chat_id)
  │   ↓ Checks user_id matches
  │
  ├─ Step 2: Create/update chat in Postgres
  │   ↓ PostgresChatRepository.find_by_id(chat_id)
  │   ↓ If not exists → Create chat in Postgres
  │   ↓ If exists → Update chat with latest info
  │
  ├─ Step 3: Fetch messages from SQLite
  │   ↓ SqliteMessageRepository.find_by_chat_id(chat_id)
  │   ↓ Gets all messages
  │
  ├─ Step 4: Fetch existing messages from Postgres
  │   ↓ PostgresMessageRepository.find_by_chat_id(chat_id)
  │   ↓ Gets already-backed-up messages
  │
  └─ Step 5: Insert new messages
      ↓ Compares message IDs
      ↓ Only inserts messages not already in Postgres
      ↓ PostgresMessageRepository.create for each new message

PostgreSQL/Supabase
  ↓ INSERT/UPDATE chats
  ↓ INSERT messages (only new ones)
Tauri Command
  ↓ Returns { message: "Chat backed up successfully to Supabase" }
Frontend
  ↓ Shows success notification
```

### Detailed Steps

1. **User Action**: User clicks "Backup Chat" button

2. **Frontend Call**:
   ```typescript
   await invoke('backup_chat', {
     dto: {
       user_id: '550e8400-e29b-41d4-a716-446655440000',
       chat_id: '770e8400-e29b-41d4-a716-446655440000'
     }
   });
   ```

3. **Backend Processing**:

   **Step 1: Verify Ownership**
   ```rust
   let sqlite_chat = sqlite_chat_repo.find_by_id(chat_id).await?
       .ok_or("Chat not found")?;
   if sqlite_chat.user_id != user_id {
       return Err("Chat does not belong to user");
   }
   ```
   - Queries **SQLite** to verify chat exists and belongs to user

   **Step 2: Sync Chat to Postgres**
   ```rust
   let postgres_chat_exists = postgres_chat_repo.find_by_id(chat_id).await?.is_some();
   if !postgres_chat_exists {
       // Create new chat in Postgres
       postgres_chat_repo.create(sqlite_chat.clone()).await?;
   } else {
       // Update existing chat
       postgres_chat_repo.update(sqlite_chat.clone()).await?;
   }
   ```
   - Creates or updates chat in **PostgreSQL/Supabase**

   **Step 3: Fetch Messages from SQLite**
   ```rust
   let sqlite_messages = sqlite_message_repo.find_by_chat_id(chat_id).await?;
   ```
   - Gets all messages from **SQLite**

   **Step 4: Check Existing Messages in Postgres**
   ```rust
   let postgres_messages = postgres_message_repo.find_by_chat_id(chat_id).await?;
   let postgres_message_ids: HashSet<Uuid> = postgres_messages
       .iter()
       .map(|m| m.id)
       .collect();
   ```
   - Gets already-backed-up messages from **PostgreSQL/Supabase**
   - Creates set of message IDs for comparison

   **Step 5: Insert New Messages**
   ```rust
   for message in sqlite_messages {
       if !postgres_message_ids.contains(&message.id) {
           postgres_message_repo.create(message).await?;
       }
   }
   ```
   - Only inserts messages not already in Postgres
   - Prevents duplicates

4. **Database Operations**:
   ```sql
   -- Postgres: Create/update chat
   INSERT INTO chats (id, user_id, title, created_at, updated_at)
   VALUES ('chat-uuid', 'user-uuid', 'My Chat', now(), now())
   ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at;
   
   -- Postgres: Insert new messages
   INSERT INTO messages (id, chat_id, role, content, created_at)
   VALUES ('msg-uuid', 'chat-uuid', 'user', 'Message content', now())
   -- Only if message ID doesn't already exist
   ```

5. **Response**: Success message, chat is now backed up to cloud

---

## 7. Sending Chat Summary via Email (Optional)

### Flow Diagram

```
Frontend
  ↓ User clicks "Email Summary" button
  ↓ invoke('send_chat_summary', { user_id, chat_id })
Tauri Command (send_chat_summary)
  ↓ Creates SendChatSummaryEmailUseCase
SendChatSummaryEmailUseCase
  ├─ Step 1: Verify chat exists and belongs to user
  │   ↓ SqliteChatRepository.find_by_id(chat_id)
  │   ↓ Checks user_id matches
  │
  ├─ Step 2: Get user email
  │   ↓ UserRepository.find_by_id(user_id)
  │   ↓ Extracts email address
  │
  ├─ Step 3: Fetch all messages
  │   ↓ SqliteMessageRepository.find_by_chat_id(chat_id)
  │   ↓ Gets all messages in chronological order
  │
  ├─ Step 4: Format messages
  │   ↓ Formats as HTML (styled, color-coded)
  │   ↓ Formats as plain text (with timestamps)
  │   ↓ Includes chat title, creation date, message count
  │
  └─ Step 5: Send email
      ↓ EmailService.send_basic_email(to, subject, html_body, text_body)
      ↓ SmtpEmailSender sends via SMTP
      ↓ Email delivered to user's inbox

SMTP Server
  ↓ Receives email
  ↓ Delivers to user's email address
Tauri Command
  ↓ Returns { message: "Chat summary sent successfully" }
Frontend
  ↓ Shows success notification
```

### Detailed Steps

1. **User Action**: User clicks "Email Summary" or "Send Summary" button

2. **Frontend Call**:
   ```typescript
   await invoke('send_chat_summary', {
     dto: {
       user_id: '550e8400-e29b-41d4-a716-446655440000',
       chat_id: '770e8400-e29b-41d4-a716-446655440000'
     }
   });
   ```

3. **Backend Processing**:

   **Step 1: Verify Ownership**
   ```rust
   let chat = sqlite_chat_repo.find_by_id(chat_id).await?
       .ok_or("Chat not found")?;
   if chat.user_id != user_id {
       return Err("Chat does not belong to user");
   }
   ```
   - Queries **SQLite** to verify chat ownership

   **Step 2: Get User Email**
   ```rust
   let user = user_repo.find_by_id(user_id).await?
       .ok_or("User not found")?;
   let user_email = user.email;
   ```
   - Queries **PostgreSQL/Supabase** for user's email address

   **Step 3: Fetch All Messages**
   ```rust
   let messages = sqlite_message_repo.find_by_chat_id(chat_id).await?;
   if messages.is_empty() {
       return Err("No messages found in chat");
   }
   ```
   - Queries **SQLite** for all messages
   - Orders chronologically

   **Step 4: Format Messages**
   ```rust
   // HTML Format
   let html = format!(r#"
   <html>
   <head><style>...</style></head>
   <body>
       <div class="header">
           <h1>{}</h1>
           <p>Created: {}</p>
           <p>Total Messages: {}</p>
       </div>
       {}
   </body>
   </html>
   "#, chat_title, created_at, message_count, formatted_messages);
   
   // Text Format
   let text = format!("Chat Summary: {}\nCreated: {}\n...", ...);
   ```
   - Creates styled HTML email with:
     - Color-coded messages (user=blue, assistant=green, system=orange)
     - Timestamps for each message
     - Chat metadata (title, creation date, message count)
   - Creates plain text version for email clients that don't support HTML

   **Step 5: Send Email**
   ```rust
   let subject = format!("Chat Summary: {}", chat.title.unwrap_or("Untitled Chat"));
   email_service.send_basic_email(
       &user_email,
       &subject,
       &html_body,
       &text_body
   ).await?;
   ```
   - Uses `EmailService` to send via SMTP
   - SMTP configuration from environment variables:
     - `SMTP_HOST`: smtp.gmail.com (or other provider)
     - `SMTP_PORT`: 587
     - `SMTP_USER`: Sender email
     - `SMTP_PASS`: Sender password/app password
     - `SMTP_FROM`: From address

4. **Email Delivery**:
   - Email sent via SMTP to user's registered email address
   - Contains formatted chat summary
   - User receives email in their inbox

5. **Response**: Success message, user notified

---

## Complete Flow Summary

### Typical User Journey

1. **Registration** → User creates account → Stored in PostgreSQL
2. **Login** → User authenticates → JWT token generated
3. **Add API Key** → User adds OpenAI/Gemini/Claude key → Stored in PostgreSQL
4. **Create Chat** → User starts new conversation → Stored in SQLite
5. **Send Messages** → User chats with AI → Messages stored in SQLite, AI responds with context
6. **Backup Chat** (Optional) → User backs up to cloud → Synced to PostgreSQL
7. **Email Summary** (Optional) → User requests summary → Email sent with formatted chat

### Data Storage Locations

- **PostgreSQL/Supabase**:
  - Users
  - User API Keys
  - Chat backups (synced from SQLite)
  - Message backups (synced from SQLite)

- **SQLite (Local)**:
  - Chats (primary storage)
  - Messages (primary storage)
  - Fast, local, offline-capable

### Key Features

1. **Local-First**: Chats stored locally for fast access
2. **Cloud Backup**: Optional sync to Supabase for persistence
3. **Full Context**: AI receives entire conversation history
4. **Email Summaries**: Formatted chat summaries via email
5. **Multi-Provider**: Support for OpenAI, Gemini, and Claude

---

## Error Handling

### Common Error Scenarios

1. **Registration**: Email already exists → Error message shown
2. **Login**: Invalid credentials → Error message shown
3. **API Key**: Missing key for provider → Error: "API key not found"
4. **Message**: AI provider error → Error message, user message still saved
5. **Backup**: Network error → Error message, local data intact
6. **Email**: SMTP error → Error message, chat data unaffected

### Data Consistency

- User messages are **always saved** before AI call
- If AI call fails, user message remains in database
- Backup operations are **idempotent** (safe to retry)
- Email sending doesn't affect chat data

---

## Performance Considerations

1. **Local Storage**: SQLite provides fast, local access to chats
2. **Context Loading**: All messages loaded once per AI call (efficient for small-medium chats)
3. **Backup**: Only new messages synced (avoids duplicates)
4. **Email**: Formatted asynchronously, sent via SMTP

---

## Security Considerations

1. **Passwords**: Hashed with Argon2 before storage
2. **API Keys**: Stored in database (should be encrypted in production)
3. **JWT Tokens**: Signed with secret, have expiration
4. **Ownership**: All operations verify user owns the resource
5. **Email**: Sent only to user's registered email address

---

This flow ensures a smooth user experience with local-first storage, optional cloud backup, and convenient email summaries.
