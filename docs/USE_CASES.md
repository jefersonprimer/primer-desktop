# Use Cases Documentation

Complete documentation of all business use cases in the Primer application.

## User Domain Use Cases

### 1. Register User

**Use Case**: `RegisterUseCase`

**Purpose**: Creates a new user account with email and password.

**Dependencies**:
- `UserRepository` - To check for existing users and create new ones
- `PasswordHasher` - To hash the password before storage

**Flow**:
1. Check if email already exists
2. Hash the password
3. Create new user entity
4. Save to repository
5. Return created user

**Errors**:
- `"Email already registered"` - Email is already in use

**Example**:
```rust
let usecase = RegisterUseCase::new(user_repo, password_hasher);
let user = usecase.execute("user@example.com", "password123").await?;
```

---

### 2. Login User

**Use Case**: `LoginUseCase`

**Purpose**: Authenticates a user and generates a JWT token.

**Dependencies**:
- `UserRepository` - To find user by email
- `PasswordHasher` - To verify password
- `TokenGenerator` - To generate JWT token

**Flow**:
1. Find user by email
2. Verify password matches
3. Generate JWT token
4. Return token

**Errors**:
- `"Invalid email or password"` - Authentication failed

**Example**:
```rust
let usecase = LoginUseCase::new(user_repo, password_hasher, token_generator);
let token = usecase.execute("user@example.com", "password123").await?;
```

---

### 3. Reset Password

**Use Case**: `ResetPasswordUseCase`

**Purpose**: Resets a user's password using a recovery token.

**Dependencies**:
- `UserRepository` - To find user and update password
- `TokenGenerator` - To validate recovery token
- `PasswordHasher` - To hash new password

**Flow**:
1. Validate recovery token
2. Extract user ID from token
3. Find user
4. Hash new password
5. Update user password
6. Return success

**Errors**:
- `"Invalid token"` - Token is invalid or expired
- `"User not found"` - User doesn't exist

**Example**:
```rust
let usecase = ResetPasswordUseCase::new(user_repo, token_generator, password_hasher);
usecase.execute("recovery-token", "newPassword123").await?;
```

---

### 4. Add API Key

**Use Case**: `AddApiKeyUseCase`

**Purpose**: Stores an API key for an AI provider.

**Dependencies**:
- `UserApiKeyRepository` - To store API keys

**Flow**:
1. Validate provider name (must be 'openai', 'gemini',)
2. Check if user already has API key for this provider
3. Create new API key entity
4. Save to repository
5. Return created API key

**Errors**:
- `"Invalid AI provider specified"` - Provider not supported
- `"User already has an API key for this provider"` - Duplicate key

**Example**:
```rust
let usecase = AddApiKeyUseCase::new(user_api_key_repo);
let api_key = usecase.execute(user_id, "openai", "sk-...").await?;
```

---

### 5. Get API Keys

**Use Case**: `GetApiKeysUseCase`

**Purpose**: Retrieves all API keys for a user.

**Dependencies**:
- `UserApiKeyRepository` - To fetch API keys

**Flow**:
1. Find all API keys for user
2. Return list of API keys

**Example**:
```rust
let usecase = GetApiKeysUseCase::new(user_api_key_repo);
let keys = usecase.execute(user_id).await?;
```

---

### 6. Delete API Key

**Use Case**: `DeleteApiKeyUseCase`

**Purpose**: Removes an API key.

**Dependencies**:
- `UserApiKeyRepository` - To delete API key

**Flow**:
1. Delete API key by ID
2. Return success

**Errors**:
- `"API key not found"` - Key doesn't exist

**Example**:
```rust
let usecase = DeleteApiKeyUseCase::new(user_api_key_repo);
usecase.execute(api_key_id).await?;
```

---

### 7. Delete Account

**Use Case**: `DeleteAccountUseCase`

**Purpose**: Permanently deletes a user account (requires password confirmation).

**Dependencies**:
- `UserRepository` - To find and delete user
- `PasswordHasher` - To verify password

**Flow**:
1. Find user by ID
2. Verify password matches
3. Delete user account
4. Return success

**Errors**:
- `"User not found"` - User doesn't exist
- `"Invalid password"` - Password doesn't match

**Example**:
```rust
let usecase = DeleteAccountUseCase::new(user_repo, password_hasher);
usecase.execute(user_id, "password123").await?;
```

---

## Chat Domain Use Cases

### 8. Create Chat

**Use Case**: `CreateChatUseCase`

**Purpose**: Creates a new chat conversation.

**Dependencies**:
- `ChatRepository` - To store chat

**Flow**:
1. Create new chat entity with user ID and optional title
2. Save to repository
3. Return created chat

**Example**:
```rust
let usecase = CreateChatUseCase::new(chat_repo);
let chat = usecase.execute(user_id, Some("My Chat")).await?;
```

---

### 9. Send Message

**Use Case**: `SendMessageUseCase`

**Purpose**: Sends a message to an AI provider and receives a response.

**Dependencies**:
- `ChatService` - To handle AI communication

**Flow**:
1. Create ChatServiceRequest
2. Call ChatService to send message to AI
3. Return AI response message

**Note**: The ChatService handles:
- Fetching user's API key
- Saving user message
- Fetching conversation context
- Calling AI provider
- Saving AI response

**Example**:
```rust
let usecase = SendMessageUseCase::new(chat_service);
let message = usecase.execute(
    user_id,
    chat_id,
    "openai",
    "Hello, AI!",
    "gpt-4",
    Some(0.7),
    Some(1000)
).await?;
```

---

### 10. Sync Messages

**Use Case**: `SyncMessagesUseCase`

**Purpose**: Syncs messages from SQLite (local) to Supabase (Postgres).

**Dependencies**:
- `MessageRepository` (SQLite) - Source repository
- `MessageRepository` (Postgres) - Destination repository
- `ChatRepository` (SQLite) - To get chat details
- `ChatRepository` (Postgres) - To create chat if needed

**Flow**:
1. Verify chat exists in SQLite
2. Ensure chat exists in Postgres (create if not)
3. Fetch all messages from SQLite
4. Insert messages into Postgres (ignore duplicates)

**Errors**:
- `"Chat not found in local storage"` - Chat doesn't exist in SQLite

**Example**:
```rust
let usecase = SyncMessagesUseCase::new(
    sqlite_message_repo,
    postgres_message_repo,
    sqlite_chat_repo,
    postgres_chat_repo
);
usecase.execute(user_id, chat_id).await?;
```

---

### 11. Backup Chat

**Use Case**: `BackupChatUseCase`

**Purpose**: Backs up a chat and all messages to Supabase.

**Dependencies**:
- `ChatRepository` (SQLite & Postgres)
- `MessageRepository` (SQLite & Postgres)

**Flow**:
1. Verify chat exists in SQLite and belongs to user
2. Create or update chat in Postgres
3. Fetch all messages from SQLite
4. Fetch existing messages from Postgres
5. Insert only new messages (avoid duplicates)
6. Return success

**Errors**:
- `"Chat not found in local storage"` - Chat doesn't exist
- `"Chat does not belong to user"` - Ownership validation failed

**Example**:
```rust
let usecase = BackupChatUseCase::new(
    sqlite_chat_repo,
    postgres_chat_repo,
    sqlite_message_repo,
    postgres_message_repo
);
usecase.execute(user_id, chat_id).await?;
```

---

## Notification Domain Use Cases

### 12. Send Email

**Use Case**: `SendEmailUseCase`

**Purpose**: Sends a custom email.

**Dependencies**:
- `EmailService` - To send emails

**Flow**:
1. Create email message
2. Send via email service
3. Return success

**Example**:
```rust
let usecase = SendEmailUseCase::new(email_service);
usecase.execute(
    "user@example.com",
    "Subject",
    "<h1>HTML Content</h1>",
    "Plain text content"
).await?;
```

---

### 13. Send Chat Summary Email

**Use Case**: `SendChatSummaryEmailUseCase`

**Purpose**: Sends a formatted summary of a chat conversation to the user's email.

**Dependencies**:
- `EmailService` - To send emails
- `ChatRepository` - To fetch chat
- `MessageRepository` - To fetch messages
- `UserRepository` - To get user email

**Flow**:
1. Verify chat exists and belongs to user
2. Get user email address
3. Fetch all messages from chat
4. Format messages as HTML and text
5. Send email with formatted summary
6. Return success

**Errors**:
- `"Chat not found"` - Chat doesn't exist
- `"Chat does not belong to user"` - Ownership validation failed
- `"User not found"` - User doesn't exist
- `"No messages found in chat"` - Chat is empty

**Email Format**:
- **HTML**: Styled with color-coded messages (user/assistant/system)
- **Text**: Plain text with timestamps
- Includes chat title, creation date, and message count

**Example**:
```rust
let usecase = SendChatSummaryEmailUseCase::new(
    email_service,
    chat_repo,
    message_repo,
    user_repo
);
usecase.execute(user_id, chat_id).await?;
```

---

## Service Layer

### ChatService

**Interface**: `ChatService`

**Purpose**: Handles communication with AI providers.

**Implementation**: `ChatServiceImpl`

**Flow**:
1. Get user's API key for provider
2. Save user's message to repository
3. Fetch all previous messages for context
4. Prepare chat completion request with full context
5. Call appropriate AI provider (OpenAI, Gemini,)
6. Save AI response to repository
7. Return AI response message

**Features**:
- **Conversation Context**: Includes all previous messages
- **Provider Abstraction**: Works with any AI provider
- **Error Handling**: Handles API failures gracefully

**Example**:
```rust
let chat_service = ChatServiceImpl::new(
    user_api_key_repo,
    message_repo,
    gemini_provider,
    openai_provider,
    
);

let request = ChatServiceRequest {
    user_id,
    chat_id,
    provider_name: "openai".to_string(),
    prompt: "Hello!".to_string(),
    model: "gpt-4".to_string(),
    temperature: Some(0.7),
    max_tokens: Some(1000),
};

let response = chat_service.send_message_to_ai(request).await?;
```

---

## Use Case Patterns

### Common Patterns

1. **Validation First**: Always validate input before processing
2. **Repository Pattern**: Use repositories for data access
3. **Error Handling**: Return descriptive errors
4. **Async Operations**: All use cases are async
5. **Dependency Injection**: Dependencies passed via constructor

### Error Handling

All use cases return `anyhow::Result<T>`:
- **Ok(T)**: Success with result
- **Err(anyhow::Error)**: Failure with error message

Errors are converted to strings in Tauri commands for frontend consumption.

### Testing Use Cases

```rust
#[tokio::test]
async fn test_login_success() {
    let user_repo = Arc::new(MockUserRepository::new());
    let password_hasher = Arc::new(Argon2PasswordHasher::new());
    let token_generator = Arc::new(JwtTokenGenerator::new(...));
    
    let usecase = LoginUseCase::new(user_repo, password_hasher, token_generator);
    let result = usecase.execute("user@example.com", "password").await;
    
    assert!(result.is_ok());
}
```

---

## Use Case Dependencies

### Dependency Graph

```
RegisterUseCase
  ├── UserRepository
  └── PasswordHasher

LoginUseCase
  ├── UserRepository
  ├── PasswordHasher
  └── TokenGenerator

SendMessageUseCase
  └── ChatService
      ├── UserApiKeyRepository
      ├── MessageRepository
      └── AiProvider (OpenAI/Gemini)

BackupChatUseCase
  ├── ChatRepository (SQLite)
  ├── ChatRepository (Postgres)
  ├── MessageRepository (SQLite)
  └── MessageRepository (Postgres)
```

---

## Best Practices

1. **Single Responsibility**: Each use case does one thing
2. **Pure Business Logic**: No infrastructure concerns
3. **Testable**: Easy to test with mocks
4. **Composable**: Use cases can call other use cases
5. **Error Messages**: Clear, actionable error messages

---

## Future Use Cases

Potential additions:

- **Recover Password**: Send password reset email
- **Update Profile**: Update user information
- **List Chats**: Get all chats for a user
- **Delete Chat**: Remove a chat and its messages
- **Export Chat**: Export chat to various formats
- **Import Chat**: Import chat from backup
