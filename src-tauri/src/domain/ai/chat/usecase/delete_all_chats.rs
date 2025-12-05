use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;
use crate::domain::ai::chat::repository::chat_repository::ChatRepository;

pub struct DeleteAllChatsUseCase {
    chat_repo: Arc<dyn ChatRepository>,
}

impl DeleteAllChatsUseCase {
    pub fn new(chat_repo: Arc<dyn ChatRepository>) -> Self {
        Self { chat_repo }
    }

    pub async fn execute(&self, user_id: Uuid) -> Result<()> {
        self.chat_repo.delete_all_by_user_id(user_id).await
    }
}
