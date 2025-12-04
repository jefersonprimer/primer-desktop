use std::sync::Arc;

use anyhow::Result;
use sqlx::{SqlitePool, PgPool};

use crate::{
    config::Config,
    domain::{
        ai::{
            chat::{
                repository::{
                    chat_repository::ChatRepository,
                    message_repository::MessageRepository,
                },
                service::chat_service::ChatService,
            },
            provider::AiProvider,
        },
        notification::email::{
            repository::email_sender::EmailSender,
            service::email_service::EmailService,
        },
        user::{
            repository::{
                user_repository::UserRepository,
                user_api_key_repository::UserApiKeyRepository,
                session_repository::SessionRepository,
            },
            service::{
                password_hasher::PasswordHasher,
                token_generator::TokenGenerator,
            },
        },
    },
    infrastructure::{
        ai::{
            chat::{
                chat_service_impl::ChatServiceImpl,
                sqlite_chat_repository::SqliteChatRepository,
                postgres_chat_repository::PostgresChatRepository,
                sqlite_message_repository::SqliteMessageRepository,
                postgres_message_repository::PostgresMessageRepository,
            },
            provider::{
                gemini::GeminiClient,
                openai::OpenAIProvider,
                claude::ClaudeProvider,
            },
        },
        database::{
            sqlite::{connect_sqlite, migrate_sqlite},
            postgres::{connect_pg, migrate_pg},
        },
        notification::email::smtp_email_sender::SmtpEmailSender,
        user::{
            sql_user_repository::SqlUserRepository,
            sql_user_api_key_repository::SqlUserApiKeyRepository,
            sqlite_session_repository::SqliteSessionRepository,
        },
    },
};

pub struct AppState {
    pub user_repo: Arc<dyn UserRepository>,
    pub user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    pub session_repo: Arc<dyn SessionRepository>,

    pub sqlite_chat_repo: Arc<dyn ChatRepository>,
    pub postgres_chat_repo: Arc<dyn ChatRepository>,
    pub sqlite_message_repo: Arc<dyn MessageRepository>,
    pub postgres_message_repo: Arc<dyn MessageRepository>,

    pub chat_service: Arc<dyn ChatService>,

    pub password_hasher: Arc<dyn PasswordHasher>,
    pub token_generator: Arc<dyn TokenGenerator>,

    pub email_service: Arc<EmailService>,
}

impl AppState {
    pub async fn initialize(config: &Config) -> Result<Self> {
        // --- Database connections ---
        let sqlite_url = std::env::var("SQLITE_DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:../primer.sqlite".to_string());
        let sqlite_pool: SqlitePool = connect_sqlite(&sqlite_url).await?;
        migrate_sqlite(&sqlite_pool).await?;

        let pg_url = &config.database.supabase_connection_string;
        let pg_pool: PgPool = connect_pg(pg_url).await?;
        migrate_pg(&pg_pool).await?;

        // --- User & session repositories ---
        let user_repo: Arc<dyn UserRepository> =
            Arc::new(SqlUserRepository::new(pg_pool.clone()));
        let user_api_key_repo: Arc<dyn UserApiKeyRepository> =
            Arc::new(SqlUserApiKeyRepository::new(pg_pool.clone()));
        let session_repo: Arc<dyn SessionRepository> =
            Arc::new(SqliteSessionRepository::new(sqlite_pool.clone()));

        // --- Chat & message repositories ---
        let sqlite_chat_repo: Arc<dyn ChatRepository> =
            Arc::new(SqliteChatRepository::new(sqlite_pool.clone()));
        let postgres_chat_repo: Arc<dyn ChatRepository> =
            Arc::new(PostgresChatRepository::new(pg_pool.clone()));

        let sqlite_message_repo: Arc<dyn MessageRepository> =
            Arc::new(SqliteMessageRepository::new(sqlite_pool.clone()));
        let postgres_message_repo: Arc<dyn MessageRepository> =
            Arc::new(PostgresMessageRepository::new(pg_pool.clone()));

        // --- AI providers ---
        let gemini_provider: Arc<dyn AiProvider> =
            Arc::new(GeminiClient::new("gemini-1.5-flash".to_string()));
        let openai_provider: Arc<dyn AiProvider> =
            Arc::new(OpenAIProvider::new());
        let claude_provider: Arc<dyn AiProvider> =
            Arc::new(ClaudeProvider::new());

        // --- Chat service ---
        let chat_service_impl = ChatServiceImpl::new(
            user_api_key_repo.clone(),
            sqlite_message_repo.clone(),
            gemini_provider,
            openai_provider,
            claude_provider,
        );
        let chat_service: Arc<dyn ChatService> = Arc::new(chat_service_impl);

        // --- Security services ---
        let password_hasher: Arc<dyn PasswordHasher> =
            Arc::new(crate::domain::user::service::password_hasher::Argon2PasswordHasher::new());

        let token_generator: Arc<dyn TokenGenerator> =
            Arc::new(crate::domain::user::service::token_generator::JwtTokenGenerator::new(
                config.jwt.jwt_secret.clone(),
                config.jwt.access_token_ttl,
                config.jwt.one_time_token_duration,
            ));

        // --- Email service ---
        let smtp_cfg = &config.smtp;
        let smtp_sender: Arc<dyn EmailSender> = Arc::new(SmtpEmailSender::new(
            &smtp_cfg.smtp_host,
            smtp_cfg.smtp_port,
            &smtp_cfg.smtp_user,
            &smtp_cfg.smtp_pass,
            &smtp_cfg.smtp_from,
        ));
        let email_service = Arc::new(EmailService::new(smtp_sender));

        Ok(Self {
            user_repo,
            user_api_key_repo,
            session_repo,
            sqlite_chat_repo,
            postgres_chat_repo,
            sqlite_message_repo,
            postgres_message_repo,
            chat_service,
            password_hasher,
            token_generator,
            email_service,
        })
    }
}

