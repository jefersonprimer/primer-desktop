# Primer Setup and Configuration Guide

Complete guide for setting up and configuring the Primer application.

## Prerequisites

### Required Software

- **Rust**: 1.77.2 or later
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **Node.js**: 18.x or later
  ```bash
  # Using nvm (recommended)
  nvm install 18
  nvm use 18
  ```

- **Tauri CLI**: 2.9.5 or later
  ```bash
  npm install -g @tauri-apps/cli
  ```

- **SQLite**: Usually pre-installed on most systems
  ```bash
  # Ubuntu/Debian
  sudo apt-get install sqlite3
  
  # macOS
  brew install sqlite3
  ```

### Optional Dependencies

- **PostgreSQL**: For Supabase connection (if using cloud backup)
- **Git**: For version control

---

## Project Structure

```
primer/
├── backend/                 # Rust backend library
│   ├── src/
│   │   ├── domain/         # Business logic
│   │   ├── infrastructure/ # External integrations
│   │   ├── config/         # Configuration
│   │   └── app_state.rs    # Dependency injection
│   ├── migrations/         # Database migrations
│   └── Cargo.toml
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx
│   │   └── ...
│   ├── src-tauri/          # Tauri application
│   │   ├── src/
│   │   │   ├── main.rs     # Tauri entry point
│   │   │   └── commands/  # Tauri commands
│   │   └── Cargo.toml
│   └── package.json
└── docs/                   # Documentation
```

---

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Database Configuration
SUPABASE_CONNECTION_STRING=postgresql://user:password@host:port/database
# OR for SQLite only:
# SUPABASE_CONNECTION_STRING=sqlite:./primer.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_TTL=1h
REFRESH_TOKEN_TTL=7d
ONE_TIME_TOKEN_DURATION=1h

# SMTP Configuration (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@primer.app

# Application URLs (optional, for future use)
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:1420

# Rate Limiting (optional)
RATE_LIMIT_ENABLED=false

# Security Settings
KEY_ROTATION_INTERVAL=30d
MAX_EMAILS_PER_DAY=100
PERMANENT_DELETION_PERIOD=30d
RECOVERY_PERIOD=7d
MAX_DELETIONS_PER_DAY=5

# Cloudinary (optional, for future image uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Redis (optional, for future caching)
REDIS_URL=redis://localhost:6379

# NATS (optional, for future message queue)
NATS_URL=nats://localhost:4222
```

### 3. Supabase Setup

#### Option A: Using Supabase Cloud

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get connection string from Project Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Option B: Local PostgreSQL

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE primer;
   ```
3. Connection string: `postgresql://postgres:password@localhost:5432/primer`

#### Option C: SQLite Only (Development)

1. Use SQLite connection string: `sqlite:./primer.db`
2. Database file will be created automatically

---

## Database Setup

### 1. Run Migrations

#### For PostgreSQL/Supabase

```bash
cd backend
sqlx migrate run --database-url "$SUPABASE_CONNECTION_STRING"
```

#### For SQLite

```bash
cd backend
sqlx migrate run --database-url "sqlite:./primer.db"
```

### 2. Verify Migrations

Check that tables were created:

```sql
-- PostgreSQL
\dt

-- SQLite
.tables
```

Expected tables:
- `users`
- `user_api_keys`
- `chats` (SQLite)
- `messages` (SQLite)
- `chats` (Postgres, if using Supabase)
- `messages` (Postgres, if using Supabase)

---

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd primer
```

### 2. Install Backend Dependencies

```bash
cd backend
cargo build
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Build Tauri Application

```bash
cd frontend
npm run tauri build
```

Or for development:

```bash
npm run tauri dev
```

---

## Development Workflow

### Running in Development Mode

1. **Start Development Server**:
   ```bash
   cd frontend
   npm run tauri dev
   ```

2. **Watch for Changes**:
   - Frontend changes: Hot reload automatically
   - Rust changes: Rebuild required (automatic in dev mode)

### Building for Production

```bash
cd frontend
npm run tauri build
```

Output will be in `frontend/src-tauri/target/release/`

---

## Configuration Details

### JWT Configuration

- **JWT_SECRET**: Must be a strong, random string (minimum 32 characters)
- **ACCESS_TOKEN_TTL**: How long access tokens are valid (e.g., "1h", "30m")
- **REFRESH_TOKEN_TTL**: How long refresh tokens are valid (e.g., "7d", "30d")
- **ONE_TIME_TOKEN_DURATION**: Duration for password reset tokens

### SMTP Configuration

#### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account → Security
   - App passwords → Generate
3. Use app password in `SMTP_PASS`

#### Other Providers

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Custom SMTP**: Use your provider's settings

### Database Configuration

#### Connection String Formats

- **PostgreSQL**: `postgresql://user:password@host:port/database`
- **SQLite**: `sqlite:./path/to/database.db`
- **Supabase**: `postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`

#### Database Selection

The application automatically detects database type:
- If connection string starts with `postgres`, uses Postgres repositories
- Otherwise, uses SQLite repositories

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Failed to connect to database`

**Solutions**:
- Verify connection string format
- Check database is running
- Verify credentials
- Check firewall/network settings

#### 2. Migration Errors

**Error**: `Migration failed`

**Solutions**:
- Ensure database exists
- Check user permissions
- Verify migration files are present
- Try running migrations manually

#### 3. Tauri Build Errors

**Error**: `tauri build failed`

**Solutions**:
- Ensure Rust toolchain is installed: `rustup show`
- Check Tauri CLI version: `tauri --version`
- Clear build cache: `cargo clean`
- Reinstall dependencies: `npm install`

#### 4. SMTP Connection Errors

**Error**: `Failed to send email`

**Solutions**:
- Verify SMTP credentials
- Check firewall allows SMTP port (587/465)
- For Gmail, ensure app password is used (not regular password)
- Test SMTP settings with a mail client

#### 5. Missing API Keys

**Error**: `API key not found for provider`

**Solutions**:
- User must add API keys via `add_api_key` command
- Verify provider name is correct: 'openai', 'gemini', or 'claude_code'
- Check API key is valid and has proper permissions

---

## Security Best Practices

### 1. Environment Variables

- **Never commit `.env` files** to version control
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use different secrets for development/production

### 2. JWT Secret

- Minimum 32 characters
- Use cryptographically random string
- Generate: `openssl rand -base64 32`

### 3. Database Security

- Use strong database passwords
- Limit database access to application only
- Enable SSL for remote connections
- Regular backups

### 4. API Keys

- Store API keys securely (encrypted in database)
- Never log API keys
- Rotate keys periodically
- Use least-privilege API keys

---

## Production Deployment

### 1. Build Production Binary

```bash
cd frontend
npm run tauri build -- --release
```

### 2. Environment Variables

- Use secure secret management (e.g., AWS Secrets Manager, HashiCorp Vault)
- Never hardcode secrets
- Use environment-specific configurations

### 3. Database

- Use managed database service (Supabase, AWS RDS, etc.)
- Enable automated backups
- Monitor performance

### 4. Email Service

- Use production SMTP service (SendGrid, Mailgun, AWS SES)
- Set up SPF/DKIM records
- Monitor delivery rates

### 5. Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor application logs
- Track performance metrics
- Set up alerts for critical errors

---

## Development Tools

### Recommended VS Code Extensions

- **rust-analyzer**: Rust language support
- **Tauri**: Tauri development tools
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting

### Useful Commands

```bash
# Format Rust code
cargo fmt

# Lint Rust code
cargo clippy

# Format TypeScript
npm run format

# Lint TypeScript
npm run lint

# Run tests
cargo test
npm test

# Check for updates
cargo outdated
npm outdated
```

---

## Next Steps

After setup:

1. **Create a user account** via `register` command
2. **Add API keys** for AI providers via `add_api_key`
3. **Create a chat** via `create_chat`
4. **Send messages** via `send_message`
5. **Backup chats** via `backup_chat`
6. **Send email summaries** via `send_chat_summary`

See [TAURI_COMMANDS.md](./TAURI_COMMANDS.md) for detailed command reference.
