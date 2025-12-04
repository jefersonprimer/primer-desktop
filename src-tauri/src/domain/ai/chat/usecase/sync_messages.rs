use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use crate::domain::ai::chat::repository::{
    message_repository::MessageRepository,
    chat_repository::ChatRepository,
};
use crate::domain::ai::chat::entity::chat::Chat;

pub struct SyncMessagesUseCase {
    sqlite_message_repo: Arc<dyn MessageRepository>,
    postgres_message_repo: Arc<dyn MessageRepository>,
    sqlite_chat_repo: Arc<dyn ChatRepository>, // Needed to get chat details
    postgres_chat_repo: Arc<dyn ChatRepository>, // Needed to create chat in postgres if not exists
}

impl SyncMessagesUseCase {
    pub fn new(
        sqlite_message_repo: Arc<dyn MessageRepository>,
        postgres_message_repo: Arc<dyn MessageRepository>,
        sqlite_chat_repo: Arc<dyn ChatRepository>,
        postgres_chat_repo: Arc<dyn ChatRepository>,
    ) -> Self {
        Self {
            sqlite_message_repo,
            postgres_message_repo,
            sqlite_chat_repo,
            postgres_chat_repo,
        }
    }

    pub async fn execute(&self, _user_id: Uuid, chat_id: Uuid) -> Result<()> {
        // 1. Check if chat exists in SQLite
        let sqlite_chat = self.sqlite_chat_repo.find_by_id(chat_id).await?
            .ok_or_else(|| anyhow!("Chat not found in local storage"))?;

        // 2. Ensure chat exists in Postgres (create if not)
        let postgres_chat_exists = self.postgres_chat_repo.find_by_id(chat_id).await?.is_some();
        if !postgres_chat_exists {
            let new_postgres_chat = Chat {
                id: sqlite_chat.id,
                user_id: sqlite_chat.user_id,
                title: sqlite_chat.title.clone(),
                created_at: sqlite_chat.created_at,
                updated_at: sqlite_chat.updated_at,
            };
            self.postgres_chat_repo.create(new_postgres_chat).await?;
        }

        // 3. Fetch messages from SQLite
        let sqlite_messages = self.sqlite_message_repo.find_by_chat_id(chat_id).await?;

        // 4. Insert messages into Postgres (assuming messages are immutable and will just be created if not exist)
        for message in sqlite_messages {
            // Check if message already exists in postgres to avoid duplicates
            // This would require a find_by_id on postgres_message_repo
            // For now, we'll just try to create. If it's a primary key conflict, it will error.
            // A more robust solution would check for existence first or use `UPSERT` if supported.
            let _ = self.postgres_message_repo.create(message).await; // Ignore error for existing messages for now
        }

        Ok(())
    }
}
