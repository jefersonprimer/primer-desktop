# Primer Architecture Documentation

## Overview

Primer is a desktop application built with Tauri 2, providing a CRUD interface for managing users, AI-powered chat conversations, and email notifications. The application uses a clean architecture pattern with clear separation between domain, infrastructure, and interface layers.

## Architecture Layers

### 1. Domain Layer (`backend/src/domain`)

The domain layer contains all business logic, independent of external frameworks or infrastructure.

#### Structure

```
domain/
├── user/                    # User management domain
│   ├── entity/              # User, UserApiKey entities
│   ├── repository/          # Repository interfaces (traits)
│   ├── service/             # PasswordHasher, TokenGenerator
│   ├── usecase/             # Business use cases
│   └── dto.rs               # Data Transfer Objects
├── ai/                      # AI chat domain
│   ├── chat/                # Chat functionality
│   │   ├── entity/          # Chat, Message entities
│   │   ├── repository/      # Repository interfaces
│   │   ├── service/         # ChatService interface
│   │   └── usecase/         # Chat use cases
│   ├── provider/            # AI provider interfaces
│   ├── audio/               # Audio processing (future)
│   └── vision/              # Vision processing (future)
└── notification/            # Notification domain
    └── email/               # Email notifications
        ├── entity/          # EmailMessage entity
        ├── repository/       # EmailSender interface
        ├── service/          # EmailService
        ├── usecase/          # Email use cases
        └── templates/        # Email HTML templates
```

#### Key Principles

- **Entities**: Core business objects (User, Chat, Message, etc.)
- **Repositories**: Abstract interfaces for data access
- **Services**: Business logic services (PasswordHasher, TokenGenerator, ChatService)
- **Use Cases**: Specific business operations (LoginUseCase, SendMessageUseCase, etc.)
- **DTOs**: Data structures for communication between layers

### 2. Infrastructure Layer (`backend/src/infrastructure`)

Implements the interfaces defined in the domain layer.

#### Structure

```
infrastructure/
├── database/                # Database connections
│   ├── database.rs          # Connection management
│   ├── postgres.rs          # Postgres-specific
│   └── sqlite.rs            # SQLite-specific
├── user/                    # User repository implementations
│   ├── sql_user_repository.rs
│   ├── sql_user_api_key_repository.rs
│   └── sqlite_user_api_key_repository.rs
├── ai/                      # AI infrastructure
│   ├── chat/                # Chat repository implementations
│   │   ├── postgres_chat_repository.rs
│   │   ├── sqlite_chat_repository.rs
│   │   ├── postgres_message_repository.rs
│   │   ├── sqlite_message_repository.rs
│   │   └── chat_service_impl.rs
│   └── provider/            # AI provider implementations
│       ├── openai.rs
│       ├── gemini.rs
│       └── claude.rs
└── notification/            # Email infrastructure
    └── email/
        └── smtp_email_sender.rs
```

#### Key Features

- **Repository Implementations**: Concrete implementations of domain repository traits
- **Database Abstraction**: Supports both SQLite (local) and Postgres (Supabase)
- **AI Provider Integration**: Implementations for OpenAI, Gemini, and Claude
- **Email Sending**: SMTP-based email delivery

### 3. Interface Layer (`frontend/src-tauri/src/commands`)

Tauri commands that expose domain use cases to the frontend.

#### Structure

```
commands/
├── mod.rs                   # Module exports
├── user_commands.rs         # User-related commands
├── chat_commands.rs         # Chat-related commands
└── email_commands.rs        # Email-related commands
```

#### Command Pattern

Each command:
1. Receives a DTO from the frontend
2. Validates input (UUID parsing, etc.)
3. Instantiates the appropriate use case
4. Executes the use case
5. Returns a response or error

## Data Flow

### Request Flow

```
Frontend (TypeScript)
  ↓ invoke('command_name', { dto })
Tauri Command (Rust)
  ↓ Validates & parses DTO
Use Case (Domain)
  ↓ Uses repositories & services
Infrastructure (Repositories)
  ↓ Database/API calls
Database/External APIs
```

### Response Flow

```
Database/External APIs
  ↓ Results
Infrastructure (Repositories)
  ↓ Domain entities
Use Case (Domain)
  ↓ Business logic results
Tauri Command (Rust)
  ↓ Serializes to DTO
Frontend (TypeScript)
  ↓ Receives response
```

## Database Strategy

### Dual Database Architecture

1. **SQLite (Local)**: 
   - Primary storage for chats and messages
   - Fast, local, no network required
   - Used for active conversations

2. **Postgres/Supabase (Cloud)**:
   - User authentication and management
   - API key storage
   - Backup destination for chats
   - Sync target for messages

### Data Distribution

- **Users**: Stored in Supabase (Postgres)
- **API Keys**: Stored in Supabase (Postgres)
- **Chats**: Stored locally in SQLite, backed up to Supabase
- **Messages**: Stored locally in SQLite, synced to Supabase

## Dependency Injection

### AppState

All dependencies are managed through `AppState`:

```rust
pub struct AppState {
    pub user_repo: Arc<dyn UserRepository>,
    pub password_hasher: Arc<dyn PasswordHasher>,
    pub token_generator: Arc<dyn TokenGenerator>,
    pub email_service: Arc<EmailService>,
    pub chat_service: Arc<dyn ChatService>,
    pub user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    pub chat_repo: Arc<dyn ChatRepository>,
    pub sqlite_message_repo: Arc<dyn MessageRepository>,
    pub postgres_message_repo: Arc<dyn MessageRepository>,
    pub sqlite_chat_repo: Arc<dyn ChatRepository>,
    pub postgres_chat_repo: Arc<dyn ChatRepository>,
}
```

### Initialization

Dependencies are initialized in `main.rs`:
1. Database connections established
2. Repositories instantiated based on database type
3. Services created with dependencies
4. AppState assembled
5. Tauri builder manages AppState

## Error Handling

### Error Types

- **Domain Errors**: `anyhow::Result` with descriptive messages
- **Command Errors**: Converted to `String` for Tauri serialization
- **Validation Errors**: UUID parsing, input validation

### Error Flow

```
Use Case → anyhow::Result<T>
  ↓
Command → Result<T, String>
  ↓
Tauri → Serialized error
  ↓
Frontend → Error handling
```

## Security

### Authentication

- JWT tokens for user authentication
- Password hashing with Argon2
- Token generation with configurable TTL

### API Keys

- Stored encrypted in database
- User-specific, provider-specific
- Retrieved only when needed for AI calls

### Data Validation

- UUID validation for all IDs
- Email format validation
- Provider name validation
- Input sanitization

## Future Extensibility

### Planned Features

- **Audio Processing**: Whisper integration for voice input
- **Vision Processing**: Image analysis capabilities
- **NATS Integration**: Message queue for async operations
- **Redis Integration**: Caching layer
- **MCP Connectors**: Google, Slack integrations

### Extension Points

- New AI providers: Implement `AiProvider` trait
- New notification channels: Implement `EmailSender` trait
- New storage backends: Implement repository traits
- New use cases: Add to domain layer, expose via commands

## Testing Strategy

### Unit Tests

- Domain use cases
- Service logic
- Repository implementations

### Integration Tests

- Database operations
- AI provider integrations
- Email sending

### E2E Tests

- Tauri command execution
- Frontend-backend communication

## Performance Considerations

### Optimization Strategies

- **Connection Pooling**: Database connection reuse
- **Async Operations**: All I/O operations are async
- **Caching**: Future Redis integration for frequently accessed data
- **Message Batching**: Efficient sync operations

### Scalability

- Stateless commands (except AppState)
- Repository pattern allows database swapping
- Service layer allows provider swapping
- Clean separation enables horizontal scaling

## Code Organization Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Dependency Inversion**: Domain depends on abstractions, not implementations
3. **Interface Segregation**: Small, focused interfaces
4. **Single Responsibility**: Each use case does one thing
5. **Open/Closed**: Open for extension, closed for modification
