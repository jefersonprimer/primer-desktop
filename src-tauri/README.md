# Primer Backend

This is the backend service for the Primer application, built with Rust and Axum.

## Documentation

- [User API Reference](docs/user_api.md) - Detailed documentation of user authentication and management endpoints.
- [Architecture](docs/architecture.md) - High-level architectural overview.
- [PostgreSQL Database](docs/postgres_database.md) - Database schema and configuration.

## Setup

1. **Environment Variables**: Copy `.env.example` to `.env` (if available) or ensure the following variables are set:
   - `DATABASE_URL` / `SUPABASE_CONNECTION_STRING`
   - `JWT_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   
2. **Run**:
   ```bash
   cargo run
   ```
