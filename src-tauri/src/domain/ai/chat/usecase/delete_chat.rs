use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;
use crate::domain::ai::chat::repository::chat_repository::ChatRepository;

pub struct DeleteChatUseCase {
    chat_repo: Arc<dyn ChatRepository>,
}

impl DeleteChatUseCase {
    pub fn new(chat_repo: Arc<dyn ChatRepository>) -> Self {
        Self { chat_repo }
    }

    pub async fn execute(&self, chat_id: Uuid) -> Result<()> {
        self.chat_repo.delete(chat_id).await
    }
}
