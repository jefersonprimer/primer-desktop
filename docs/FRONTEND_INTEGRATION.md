# Frontend Integration Guide

Complete guide for integrating with Primer's Tauri backend from the frontend.

## Overview

The Primer frontend is built with React + TypeScript and communicates with the Rust backend through Tauri commands. All backend functionality is exposed via `invoke()` calls.

## Setup

### Install Dependencies

```bash
cd frontend
npm install
npm install @tauri-apps/api
```

### Import Tauri API

```typescript
import { invoke } from '@tauri-apps/api/core';
```

---

## Basic Usage Pattern

### Standard Command Call

```typescript
try {
  const result = await invoke('command_name', {
    dto: {
      // Command parameters
    }
  });
  // Handle success
} catch (error) {
  // Handle error (error is a string)
  console.error('Command failed:', error);
}
```

### Type-Safe Wrapper

```typescript
async function callCommand<T>(
  command: string,
  dto: any
): Promise<T> {
  try {
    return await invoke<T>(command, { dto });
  } catch (error) {
    throw new Error(error as string);
  }
}
```

---

## User Management

### Register User

```typescript
const registerUser = async (email: string, password: string) => {
  try {
    const result = await invoke<{ message: string }>('register', {
      dto: { email, password }
    });
    console.log('Registration successful:', result.message);
    return result;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};
```

### Login

```typescript
const login = async (email: string, password: string) => {
  try {
    const result = await invoke<{ token: string }>('login', {
      dto: { email, password }
    });
    // Store token
    localStorage.setItem('auth_token', result.token);
    return result;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Add API Key

```typescript
const addApiKey = async (
  userId: string,
  provider: 'openai' | 'gemini' | 'claude_code',
  apiKey: string
) => {
  try {
    const result = await invoke<{ message: string }>('add_api_key', {
      dto: { user_id: userId, provider, api_key: apiKey }
    });
    return result;
  } catch (error) {
    console.error('Failed to add API key:', error);
    throw error;
  }
};
```

### Get API Keys

```typescript
interface ApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key_hashed: string;
  created_at: string;
}

const getApiKeys = async (userId: string) => {
  try {
    const result = await invoke<{ api_keys: ApiKey[] }>('get_api_keys', {
      dto: { user_id: userId }
    });
    return result.api_keys;
  } catch (error) {
    console.error('Failed to get API keys:', error);
    throw error;
  }
};
```

---

## Chat Management

### Create Chat

```typescript
const createChat = async (userId: string, title?: string) => {
  try {
    const result = await invoke<{ chat_id: string }>('create_chat', {
      dto: { user_id: userId, title }
    });
    return result.chat_id;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
};
```

### Send Message

```typescript
interface SendMessageParams {
  userId: string;
  chatId: string;
  content: string;
  providerName: 'openai' | 'gemini' | 'claude_code';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const sendMessage = async (params: SendMessageParams) => {
  try {
    const result = await invoke<{ message: Message }>('send_message', {
      dto: {
        user_id: params.userId,
        chat_id: params.chatId,
        content: params.content,
        provider_name: params.providerName,
        model: params.model,
        temperature: params.temperature,
        max_tokens: params.maxTokens
      }
    });
    return result.message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};
```

### Backup Chat

```typescript
const backupChat = async (userId: string, chatId: string) => {
  try {
    const result = await invoke<{ message: string }>('backup_chat', {
      dto: { user_id: userId, chat_id: chatId }
    });
    return result;
  } catch (error) {
    console.error('Failed to backup chat:', error);
    throw error;
  }
};
```

### Sync Messages

```typescript
const syncMessages = async (userId: string, chatId: string) => {
  try {
    const result = await invoke<{ message: string }>('sync_messages', {
      dto: { user_id: userId, chat_id: chatId }
    });
    return result;
  } catch (error) {
    console.error('Failed to sync messages:', error);
    throw error;
  }
};
```

---

## Email Features

### Send Chat Summary

```typescript
const sendChatSummary = async (userId: string, chatId: string) => {
  try {
    const result = await invoke<{ message: string }>('send_chat_summary', {
      dto: { user_id: userId, chat_id: chatId }
    });
    return result;
  } catch (error) {
    console.error('Failed to send chat summary:', error);
    throw error;
  }
};
```

---

## React Hooks

### Custom Hook for Commands

```typescript
import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

function useCommand<T, P = any>(
  commandName: string
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (dto: P): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<T>(commandName, { dto });
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [commandName]);

  return { execute, loading, error };
}
```

### Usage Example

```typescript
function ChatComponent() {
  const { execute: sendMessage, loading, error } = useCommand<
    { message: Message },
    SendMessageParams
  >('send_message');

  const handleSend = async () => {
    const result = await sendMessage({
      userId: '...',
      chatId: '...',
      content: 'Hello!',
      providerName: 'openai',
      model: 'gpt-4'
    });
    if (result) {
      // Handle success
    }
  };

  return (
    <div>
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

---

## Complete Chat Example

```typescript
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const userId = 'your-user-id'; // Get from auth

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const result = await invoke<{ chat_id: string }>('create_chat', {
          dto: { user_id: userId, title: 'New Chat' }
        });
        setChatId(result.chat_id);
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    };
    initChat();
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage: Message = {
      id: 'temp',
      chat_id: chatId,
      user_id: userId,
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await invoke<{ message: Message }>('send_message', {
        dto: {
          user_id: userId,
          chat_id: chatId,
          content: input,
          provider_name: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000
        }
      });
      setMessages(prev => [...prev, result.message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        ...userMessage,
        role: 'system',
        content: `Error: ${error}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!chatId) return;
    try {
      await invoke('backup_chat', {
        dto: { user_id: userId, chat_id: chatId }
      });
      alert('Chat backed up successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleEmailSummary = async () => {
    if (!chatId) return;
    try {
      await invoke('send_chat_summary', {
        dto: { user_id: userId, chat_id: chatId }
      });
      alert('Chat summary sent to your email!');
    } catch (error) {
      console.error('Failed to send summary:', error);
    }
  };

  return (
    <div className="chat-app">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="role">{msg.role}</div>
            <div className="content">{msg.content}</div>
          </div>
        ))}
        {loading && <div>Thinking...</div>}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
        <button onClick={handleBackup}>Backup</button>
        <button onClick={handleEmailSummary}>Email Summary</button>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Error Types

```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE'
}

function parseError(error: string): { type: ErrorType; message: string } {
  if (error.includes('Invalid') || error.includes('format')) {
    return { type: ErrorType.VALIDATION, message: error };
  }
  if (error.includes('not found')) {
    return { type: ErrorType.NOT_FOUND, message: error };
  }
  if (error.includes('does not belong')) {
    return { type: ErrorType.PERMISSION, message: error };
  }
  if (error.includes('already')) {
    return { type: ErrorType.BUSINESS_LOGIC, message: error };
  }
  return { type: ErrorType.EXTERNAL_SERVICE, message: error };
}
```

### User-Friendly Error Messages

```typescript
function getUserFriendlyError(error: string): string {
  const parsed = parseError(error);
  switch (parsed.type) {
    case ErrorType.VALIDATION:
      return 'Please check your input and try again.';
    case ErrorType.NOT_FOUND:
      return 'The requested item was not found.';
    case ErrorType.PERMISSION:
      return 'You do not have permission to perform this action.';
    case ErrorType.BUSINESS_LOGIC:
      return parsed.message;
    case ErrorType.EXTERNAL_SERVICE:
      return 'A service error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
}
```

---

## Type Definitions

### Complete TypeScript Types

```typescript
// User Types
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

interface ApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key_hashed: string;
  created_at: string;
}

// Chat Types
interface CreateChatDto {
  user_id: string;
  title?: string;
}

interface CreateChatResponse {
  chat_id: string;
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

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface SendMessageResponse {
  message: Message;
}

// Email Types
interface SendChatSummaryEmailDto {
  user_id: string;
  chat_id: string;
}
```

---

## Best Practices

### 1. Loading States

Always show loading indicators:

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await invoke('command', { dto });
  } finally {
    setLoading(false);
  }
};
```

### 2. Error Boundaries

Wrap components in error boundaries:

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    console.error('Command error:', error);
  }
  render() {
    return this.props.children;
  }
}
```

### 3. Optimistic Updates

Update UI immediately, rollback on error:

```typescript
const sendMessage = async () => {
  const tempMessage = { id: 'temp', content: input, ... };
  setMessages(prev => [...prev, tempMessage]);
  
  try {
    const result = await invoke('send_message', { dto });
    setMessages(prev => prev.map(m => 
      m.id === 'temp' ? result.message : m
    ));
  } catch (error) {
    setMessages(prev => prev.filter(m => m.id !== 'temp'));
    // Show error
  }
};
```

### 4. Debouncing

Debounce rapid calls:

```typescript
import { debounce } from 'lodash';

const debouncedSend = debounce(async (content: string) => {
  await invoke('send_message', { dto: { content } });
}, 300);
```

---

## Testing

### Mock Tauri Commands

```typescript
// __mocks__/tauri.ts
export const invoke = jest.fn(async (command: string, args: any) => {
  if (command === 'login') {
    return { token: 'mock-token' };
  }
  // ... other mocks
});
```

### Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import ChatApp from './ChatApp';

jest.mock('@tauri-apps/api/core');

test('sends message', async () => {
  (invoke as jest.Mock).mockResolvedValue({
    message: { id: '1', content: 'Response', role: 'assistant', ... }
  });

  render(<ChatApp />);
  const input = screen.getByPlaceholderText('Type your message...');
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.click(screen.getByText('Send'));

  expect(invoke).toHaveBeenCalledWith('send_message', {
    dto: expect.objectContaining({ content: 'Hello' })
  });
});
```

---

## Performance Tips

1. **Batch Operations**: Use `sync_messages` or `backup_chat` for bulk operations
2. **Cache Results**: Cache user info, API keys, etc.
3. **Lazy Loading**: Load chats/messages on demand
4. **Virtual Scrolling**: For long message lists
5. **Debounce Input**: Debounce message sending

---

## Debugging

### Enable Tauri DevTools

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  // DevTools are available
}
```

### Log Command Calls

```typescript
const invokeWithLogging = async (command: string, dto: any) => {
  console.log('Invoking:', command, dto);
  try {
    const result = await invoke(command, { dto });
    console.log('Result:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## Resources

- [Tauri API Documentation](https://tauri.app/api/js/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
