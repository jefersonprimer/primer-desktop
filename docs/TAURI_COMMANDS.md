# Tauri Commands Reference

Complete reference for all Tauri commands available in the Primer application.

## Overview

All commands are invoked from the frontend using:

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('command_name', { dto: { ... } });
```

## User Commands

### `login`

Authenticates a user and returns a JWT token.

**Request:**
```typescript
await invoke('login', {
  dto: {
    email: 'user@example.com',
    password: 'securePassword123'
  }
});
```

**Response:**
```typescript
{
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

**Errors:**
- `"Invalid email or password"` - Authentication failed
- `"User not found"` - Email doesn't exist

---

### `register`

Creates a new user account.

**Request:**
```typescript
await invoke('register', {
  dto: {
    email: 'user@example.com',
    password: 'securePassword123'
  }
});
```

**Response:**
```typescript
{
  message: 'User registered successfully'
}
```

**Errors:**
- `"Email already registered"` - Email already exists

---

### `reset_password`

Resets a user's password using a recovery token.

**Request:**
```typescript
await invoke('reset_password', {
  dto: {
    token: 'valid-reset-token',
    new_password: 'newSecurePassword123'
  }
});
```

**Response:**
```typescript
{
  message: 'Password reset successfully'
}
```

**Errors:**
- `"Invalid token"` - Token is invalid or expired
- `"User not found"` - Token doesn't match any user

---

### `add_api_key`

Adds an API key for an AI provider (OpenAI, Gemini, or Claude).

**Request:**
```typescript
await invoke('add_api_key', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    provider: 'openai', // or 'gemini' or 'claude_code'
    api_key: 'sk-...'
  }
});
```

**Response:**
```typescript
{
  message: 'API key added successfully'
}
```

**Errors:**
- `"Invalid AI provider specified"` - Provider must be 'openai', 'gemini', or 'claude_code'
- `"User already has an API key for this provider"` - Key already exists

---

### `get_api_keys`

Retrieves all API keys for a user (keys are masked).

**Request:**
```typescript
await invoke('get_api_keys', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000'
  }
});
```

**Response:**
```typescript
{
  api_keys: [
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      provider: 'openai',
      api_key_hashed: '********',
      created_at: '2024-01-15T10:30:00Z'
    }
  ]
}
```

---

### `delete_api_key`

Deletes an API key.

**Request:**
```typescript
await invoke('delete_api_key', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    api_key_id: '660e8400-e29b-41d4-a716-446655440000'
  }
});
```

**Response:**
```typescript
{
  message: 'API key deleted successfully'
}
```

**Errors:**
- `"API key not found"` - Key doesn't exist

---

### `delete_account`

Permanently deletes a user account (requires password confirmation).

**Request:**
```typescript
await invoke('delete_account', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    password: 'currentPassword123'
  }
});
```

**Response:**
```typescript
{
  message: 'Account deleted successfully'
}
```

**Errors:**
- `"Invalid password"` - Password doesn't match
- `"User not found"` - User doesn't exist

---

## Chat Commands

### `create_chat`

Creates a new chat conversation.

**Request:**
```typescript
await invoke('create_chat', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'My Chat' // Optional
  }
});
```

**Response:**
```typescript
{
  chat_id: '770e8400-e29b-41d4-a716-446655440000'
}
```

---

### `send_message`

Sends a message to an AI provider and receives a response. Includes full conversation context.

**Request:**
```typescript
await invoke('send_message', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    chat_id: '770e8400-e29b-41d4-a716-446655440000',
    content: 'What is the capital of France?',
    provider_name: 'openai', // or 'gemini' or 'claude_code'
    model: 'gpt-4',
    temperature: 0.7, // Optional, 0.0-2.0
    max_tokens: 1000  // Optional
  }
});
```

**Response:**
```typescript
{
  message: {
    id: '880e8400-e29b-41d4-a716-446655440000',
    chat_id: '770e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    role: 'assistant',
    content: 'The capital of France is Paris.',
    created_at: '2024-01-15T10:35:00Z'
  }
}
```

**Errors:**
- `"API key not found for provider: ..."` - User hasn't added API key for this provider
- `"Unsupported AI provider: ..."` - Invalid provider name
- `"No response from AI"` - AI provider returned empty response

**Note:** The user's message is saved first, then all previous messages are fetched to provide context to the AI.

---

### `sync_messages`

Syncs messages from SQLite (local) to Supabase (Postgres).

**Request:**
```typescript
await invoke('sync_messages', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    chat_id: '770e8400-e29b-41d4-a716-446655440000'
  }
});
```

**Response:**
```typescript
{
  message: 'Messages synced successfully'
}
```

**Errors:**
- `"Chat not found in local storage"` - Chat doesn't exist in SQLite

**Note:** Creates chat in Postgres if it doesn't exist, then copies all messages.

---

### `backup_chat`

Backs up a chat and all its messages to Supabase.

**Request:**
```typescript
await invoke('backup_chat', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    chat_id: '770e8400-e29b-41d4-a716-446655440000'
  }
});
```

**Response:**
```typescript
{
  message: 'Chat backed up successfully to Supabase'
}
```

**Errors:**
- `"Chat not found in local storage"` - Chat doesn't exist
- `"Chat does not belong to user"` - Ownership validation failed

**Note:** 
- Creates/updates chat in Postgres
- Syncs all messages, avoiding duplicates
- Only backs up new messages (by ID comparison)

---

## Email Commands

### `send_email`

Sends a custom email.

**Request:**
```typescript
await invoke('send_email', {
  dto: {
    to: 'recipient@example.com',
    subject: 'Hello',
    html_body: '<h1>Hello</h1><p>This is HTML content.</p>',
    text_body: 'Hello\n\nThis is plain text content.'
  }
});
```

**Response:**
```typescript
{
  message: 'Email sent successfully'
}
```

**Errors:**
- SMTP connection errors
- Invalid email addresses
- Email sending failures

---

### `send_chat_summary`

Sends a formatted summary of a chat conversation to the user's email.

**Request:**
```typescript
await invoke('send_chat_summary', {
  dto: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    chat_id: '770e8400-e29b-41d4-a716-446655440000'
  }
});
```

**Response:**
```typescript
{
  message: 'Chat summary sent successfully'
}
```

**Errors:**
- `"Chat not found"` - Chat doesn't exist
- `"Chat does not belong to user"` - Ownership validation failed
- `"User not found"` - User doesn't exist
- `"No messages found in chat"` - Chat is empty

**Email Format:**
- **HTML**: Styled email with color-coded messages (user/assistant/system)
- **Text**: Plain text version with timestamps
- Includes chat title, creation date, and total message count

---

## Error Handling

### Standard Error Format

All commands return errors as strings:

```typescript
try {
  const result = await invoke('command_name', { dto: { ... } });
} catch (error) {
  console.error('Command failed:', error);
  // error is a string with the error message
}
```

### Common Error Patterns

1. **Validation Errors**: Invalid UUID format, missing required fields
2. **Not Found Errors**: Resource doesn't exist
3. **Permission Errors**: User doesn't own the resource
4. **Business Logic Errors**: Invalid state, duplicate entries
5. **External Service Errors**: AI provider failures, email sending failures

---

## TypeScript Types

### Recommended Type Definitions

```typescript
// User DTOs
interface LoginDto {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterDto {
  email: string;
  password: string;
}

interface AddApiKeyDto {
  user_id: string;
  provider: 'openai' | 'gemini' | 'claude_code';
  api_key: string;
}

// Chat DTOs
interface CreateChatDto {
  user_id: string;
  title?: string;
}

interface SendMessageDto {
  user_id: string;
  chat_id: string;
  content: string;
  provider_name: 'openai' | 'gemini' | 'claude_code';
  model: string;
  temperature?: number;
  max_tokens?: number;
}

interface MessageDto {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string; // ISO 8601
}

// Email DTOs
interface SendChatSummaryEmailDto {
  user_id: string;
  chat_id: string;
}
```

---

## Best Practices

### 1. Error Handling

Always wrap command calls in try-catch:

```typescript
try {
  const result = await invoke('send_message', { dto });
  // Handle success
} catch (error) {
  // Handle error - show user-friendly message
  console.error('Failed to send message:', error);
}
```

### 2. Loading States

Show loading indicators during async operations:

```typescript
const [loading, setLoading] = useState(false);

const sendMessage = async () => {
  setLoading(true);
  try {
    const result = await invoke('send_message', { dto });
    // Handle result
  } finally {
    setLoading(false);
  }
};
```

### 3. UUID Validation

Validate UUIDs before sending:

```typescript
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
```

### 4. Retry Logic

Implement retry for transient failures:

```typescript
const invokeWithRetry = async (command: string, dto: any, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await invoke(command, { dto });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## Command Execution Flow

1. **Frontend**: Calls `invoke('command_name', { dto })`
2. **Tauri**: Routes to Rust command handler
3. **Command**: Validates DTO, parses UUIDs
4. **Use Case**: Executes business logic
5. **Repository**: Accesses database/APIs
6. **Response**: Serialized and returned to frontend

---

## Performance Considerations

- **Async Operations**: All commands are async - don't block UI
- **Batch Operations**: Use `sync_messages` or `backup_chat` for bulk operations
- **Caching**: Consider caching frequently accessed data (user info, API keys)
- **Error Recovery**: Implement retry logic for network-dependent operations
