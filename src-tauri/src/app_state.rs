use std::sync::Arc;

use anyhow::Result;
use sqlx::SqlitePool;

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
        },
        config::repository::ConfigRepository,
        prompt_preset::repository::PromptPresetRepository,
        maintenance::repository::MaintenanceRepository,
        changelog::repository::ChangelogRepository,
        calendar::repository::CalendarRepository,
        notion::repository::NotionRepository,
    },
    infrastructure::{
        ai::{
            chat::{
                chat_service_impl::ChatServiceImpl,
                sqlite_chat_repository::SqliteChatRepository,
                sqlite_message_repository::SqliteMessageRepository,
            },
            provider::{
                gemini::GeminiClient,
                openai::OpenAIProvider,
                openrouter::OpenRouterProvider,
            },
        },
        database::{
            sqlite::{connect_sqlite, migrate_sqlite},
            postgres::{connect_pg, migrate_pg},
        },
        notification::email::smtp_email_sender::SmtpEmailSender,
        user::{
            sql_user_repository::SqlUserRepository,
            sqlite_session_repository::SqliteSessionRepository,
            sqlite_user_repository::SqliteUserRepository,
            sqlite_user_api_key_repository::SqliteUserApiKeyRepository,
        },
        config::sqlite::SqliteConfigRepository,
        prompt_preset::sqlite_repository::SqlitePromptPresetRepository,
        maintenance::sqlite_repository::SqliteMaintenanceRepository,
        changelog::{
            postgres_repository::PostgresChangelogRepository,
            noop_repository::NoOpChangelogRepository,
        },
        calendar::{
            postgres_calendar_repository::PostgresCalendarRepository,
            noop_calendar_repository::NoOpCalendarRepository,
        },
        notion::{
            postgres_repository::PostgresNotionRepository,
            noop_repository::NoOpNotionRepository,
            client::NotionClient,
        },
    },
};

pub struct AppState {
    pub user_repo: Arc<dyn UserRepository>,
    pub user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    pub session_repo: Arc<dyn SessionRepository>,

    pub sqlite_chat_repo: Arc<dyn ChatRepository>,
    pub sqlite_message_repo: Arc<dyn MessageRepository>,

    pub config_repo: Arc<dyn ConfigRepository>,
    pub prompt_preset_repo: Arc<dyn PromptPresetRepository>,
    pub maintenance_repo: Arc<dyn MaintenanceRepository>,
    pub changelog_repo: Arc<dyn ChangelogRepository>,
    pub calendar_repo: Arc<dyn CalendarRepository>,
    pub notion_repo: Arc<dyn NotionRepository>,
    pub notion_client: Arc<NotionClient>,

    pub chat_service: Arc<dyn ChatService>,

    pub email_service: Arc<EmailService>,
}

impl AppState {
    pub async fn initialize(config: &Config, db_url: Option<String>) -> Result<Self> {
        // --- Database connections ---
        let sqlite_url = if let Some(url) = db_url {
            url
        } else {
            std::env::var("SQLITE_DATABASE_URL")
                .unwrap_or_else(|_| "sqlite:../primer.sqlite".to_string())
        };
        let sqlite_pool: SqlitePool = connect_sqlite(&sqlite_url).await?;
        migrate_sqlite(&sqlite_pool).await?;

        // Initialize Sqlite Repos (always needed)
        let sqlite_chat_repo: Arc<dyn ChatRepository> =
            Arc::new(SqliteChatRepository::new(sqlite_pool.clone()));
        let sqlite_message_repo: Arc<dyn MessageRepository> =
            Arc::new(SqliteMessageRepository::new(sqlite_pool.clone()));
        let session_repo: Arc<dyn SessionRepository> =
            Arc::new(SqliteSessionRepository::new(sqlite_pool.clone()));
        
        let config_repo: Arc<dyn ConfigRepository> =
            Arc::new(SqliteConfigRepository::new(sqlite_pool.clone()));

        let prompt_preset_repo: Arc<dyn PromptPresetRepository> =
            Arc::new(SqlitePromptPresetRepository::new(sqlite_pool.clone()));

        let maintenance_repo: Arc<dyn MaintenanceRepository> =
            Arc::new(SqliteMaintenanceRepository::new(sqlite_pool.clone()));

        // ALWAYS use Sqlite for User Api Keys (Local Only)
        let user_api_key_repo: Arc<dyn UserApiKeyRepository> =
            Arc::new(SqliteUserApiKeyRepository::new(sqlite_pool.clone()));

        let pg_url = &config.database.database_url;
        let pg_pool_result = connect_pg(pg_url).await;

        let (user_repo, changelog_repo, calendar_repo, notion_repo) = match pg_pool_result {
            Ok(pg_pool) => {
                migrate_pg(&pg_pool).await?;
                (
                    Arc::new(SqlUserRepository::new(pg_pool.clone())) as Arc<dyn UserRepository>,
                    Arc::new(PostgresChangelogRepository::new(pg_pool.clone())) as Arc<dyn ChangelogRepository>,
                    Arc::new(PostgresCalendarRepository::new(pg_pool.clone())) as Arc<dyn CalendarRepository>,
                    Arc::new(PostgresNotionRepository::new(pg_pool.clone())) as Arc<dyn NotionRepository>,
                )
            },
            Err(e) => {
                eprintln!("WARNING: Failed to connect to Postgres. Falling back to Sqlite. Error: {}", e);
                (
                    Arc::new(SqliteUserRepository::new(sqlite_pool.clone())) as Arc<dyn UserRepository>,
                    Arc::new(NoOpChangelogRepository::new()) as Arc<dyn ChangelogRepository>,
                    Arc::new(NoOpCalendarRepository::new()) as Arc<dyn CalendarRepository>,
                    Arc::new(NoOpNotionRepository::new()) as Arc<dyn NotionRepository>,
                )
            }
        };

        // --- AI providers ---
        let gemini_provider: Arc<dyn AiProvider> =
            Arc::new(GeminiClient::new("gemini-2.5-flash".to_string()));
        let openai_provider: Arc<dyn AiProvider> =
            Arc::new(OpenAIProvider::new());
        let openrouter_provider: Arc<dyn AiProvider> =
            Arc::new(OpenRouterProvider::new());

        // --- Chat service ---
        let create_event_usecase = Arc::new(crate::domain::calendar::usecase::create_event::CreateEventUseCase::new(
            calendar_repo.clone(),
            session_repo.clone(),
        ));

        let notion_client = Arc::new(NotionClient::new());
        let create_page_usecase = Arc::new(crate::domain::notion::usecase::create_page::CreatePageUseCase::new(
            notion_repo.clone(),
            notion_client.clone(),
        ));

        let chat_service_impl = ChatServiceImpl::new(
            config_repo.clone(),
            user_api_key_repo.clone(),
            sqlite_message_repo.clone(),
            sqlite_chat_repo.clone(),
            prompt_preset_repo.clone(),
            gemini_provider,
            openai_provider,
            openrouter_provider,
            create_event_usecase,
            create_page_usecase,
        );
        let chat_service: Arc<dyn ChatService> = Arc::new(chat_service_impl);

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
            sqlite_message_repo,
            config_repo,
            prompt_preset_repo,
            maintenance_repo,
            changelog_repo,
            calendar_repo,
            notion_repo,
            notion_client,
            chat_service,
            email_service,
        })
    }
}
            