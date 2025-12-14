use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use log::info;
use crate::domain::ai::chat::repository::{
    chat_repository::ChatRepository,
    message_repository::MessageRepository,
};

pub struct BackupChatUseCase {
    sqlite_chat_repo: Arc<dyn ChatRepository>,
    postgres_chat_repo: Arc<dyn ChatRepository>,
    sqlite_message_repo: Arc<dyn MessageRepository>,
    postgres_message_repo: Arc<dyn MessageRepository>,
}

impl BackupChatUseCase {
    pub fn new(
        sqlite_chat_repo: Arc<dyn ChatRepository>,
        postgres_chat_repo: Arc<dyn ChatRepository>,
        sqlite_message_repo: Arc<dyn MessageRepository>,
        postgres_message_repo: Arc<dyn MessageRepository>,
    ) -> Self {
        Self {
            sqlite_chat_repo,
            postgres_chat_repo,
            sqlite_message_repo,
            postgres_message_repo,
        }
    }

    pub async fn execute(&self, user_id: Uuid, chat_id: Uuid) -> Result<()> {
        // 1. Verify chat exists in SQLite and belongs to user
        let sqlite_chat = self.sqlite_chat_repo.find_by_id(chat_id).await?
            .ok_or_else(|| anyhow!("Chat not found in local storage"))?;

        if sqlite_chat.user_id != user_id {
            return Err(anyhow!("Chat does not belong to user"));
        }

        // 2. Ensure chat exists in Postgres (create if not exists)
        let postgres_chat_exists = self.postgres_chat_repo.find_by_id(chat_id).await?.is_some();
        if !postgres_chat_exists {
            let new_postgres_chat = crate::domain::ai::chat::entity::chat::Chat {
                id: sqlite_chat.id,
                user_id: sqlite_chat.user_id,
                title: sqlite_chat.title.clone(),
                prompt_preset_id: None,
                model: sqlite_chat.model.clone(),
                created_at: sqlite_chat.created_at,
                updated_at: sqlite_chat.updated_at,
            };
            self.postgres_chat_repo.create(new_postgres_chat).await?;
        } else {
            // Update existing chat in Postgres with latest info from SQLite
            let updated_chat = crate::domain::ai::chat::entity::chat::Chat {
                id: sqlite_chat.id,
                user_id: sqlite_chat.user_id,
                title: sqlite_chat.title.clone(),
                prompt_preset_id: None,
                model: sqlite_chat.model.clone(),
                created_at: sqlite_chat.created_at,
                updated_at: sqlite_chat.updated_at,
            };
            self.postgres_chat_repo.update(updated_chat).await?;
        }

        // 3. Fetch all messages from SQLite
        let sqlite_messages = self.sqlite_message_repo.find_by_chat_id(chat_id).await?;

        // 4. Fetch existing messages from Postgres to avoid duplicates
        let postgres_messages = self.postgres_message_repo.find_by_chat_id(chat_id).await?;
        let postgres_message_ids: std::collections::HashSet<Uuid> = postgres_messages
            .iter()
            .map(|m| m.id)
            .collect();

        // 5. Insert only new messages into Postgres (messages not already backed up)
        let mut backed_up_count = 0;
        for message in sqlite_messages {
            if !postgres_message_ids.contains(&message.id) {
                self.postgres_message_repo.create(message).await?;
                backed_up_count += 1;
            }
        }

        // Note: We don't update existing messages in Postgres to preserve backup integrity
        // If a message was modified locally, it would create a new message with a new ID
        
        info!("Backed up {} new messages for chat {}", backed_up_count, chat_id);

        Ok(())
    }
}