# Primer Documentation

Complete documentation for the Primer application.

## Documentation Index

### Core Documentation

1. **[Architecture](./ARCHITECTURE.md)** - System architecture, layers, and design patterns
2. **[Tauri Commands](./TAURI_COMMANDS.md)** - Complete reference for all backend commands
3. **[Use Cases](./USE_CASES.md)** - Detailed documentation of all business use cases
4. **[Database](./DATABASE.md)** - Database schemas, migrations, and data models
5. **[Setup Guide](./SETUP.md)** - Installation and configuration instructions
6. **[Frontend Integration](./FRONTEND_INTEGRATION.md)** - Guide for frontend developers

## Quick Start

1. **Setup**: Follow the [Setup Guide](./SETUP.md)
2. **Commands**: See [Tauri Commands Reference](./TAURI_COMMANDS.md)
3. **Integration**: Check [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)

## Application Overview

Primer is a desktop application that provides:

- **User Management**: Registration, authentication, password reset, account deletion
- **AI Chat**: Conversations with OpenAI, Gemini, and Claude
- **Local Storage**: SQLite for fast, local chat storage
- **Cloud Backup**: Supabase/PostgreSQL for chat backup and sync
- **Email Notifications**: Send chat summaries via email

## Architecture Highlights

- **Clean Architecture**: Clear separation of domain, infrastructure, and interface layers
- **Tauri 2**: Desktop application framework
- **Dual Database**: SQLite (local) + PostgreSQL (cloud backup)
- **Type Safety**: Full TypeScript support for frontend
- **Async/Await**: All operations are asynchronous

## Key Features

### User Domain
- Email/password authentication
- JWT token generation
- API key management (OpenAI, Gemini, Claude)
- Secure password hashing (Argon2)

### Chat Domain
- Create and manage conversations
- Full conversation context for AI
- Local-first storage (SQLite)
- Cloud backup (Supabase)
- Message synchronization

### Notification Domain
- Email sending via SMTP
- Formatted chat summaries
- HTML and plain text email support

## Technology Stack

### Backend
- **Rust**: Core language
- **Tauri 2**: Desktop framework
- **SQLx**: Database access
- **Argon2**: Password hashing
- **JWT**: Token generation
- **Lettre**: Email sending

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Tauri API**: Backend communication

### Databases
- **SQLite**: Local storage
- **PostgreSQL**: Cloud storage (Supabase)

## Getting Help

### Common Issues

- **Database Connection**: See [Setup Guide - Troubleshooting](./SETUP.md#troubleshooting)
- **Command Errors**: See [Tauri Commands - Error Handling](./TAURI_COMMANDS.md#error-handling)
- **Integration Issues**: See [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)

### Documentation Structure

```
docs/
├── README.md              # This file
├── ARCHITECTURE.md        # System architecture
├── TAURI_COMMANDS.md      # Command reference
├── USE_CASES.md           # Business logic
├── DATABASE.md            # Database schemas
├── SETUP.md               # Setup instructions
└── FRONTEND_INTEGRATION.md # Frontend guide
```

## Contributing

When adding new features:

1. **Document Use Cases**: Add to [USE_CASES.md](./USE_CASES.md)
2. **Document Commands**: Add to [TAURI_COMMANDS.md](./TAURI_COMMANDS.md)
3. **Update Architecture**: Update [ARCHITECTURE.md](./ARCHITECTURE.md) if needed
4. **Database Changes**: Document in [DATABASE.md](./DATABASE.md)

## License

[Your License Here]

---

**Last Updated**: 2024-12-03
