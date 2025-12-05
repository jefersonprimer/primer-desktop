use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;
use crate::domain::ai::chat::{
    entity::chat::Chat,
    repository::chat_repository::ChatRepository,
};

pub struct GetChatsUseCase {
    chat_repo: Arc<dyn ChatRepository>,
}

impl GetChatsUseCase {
    pub fn new(chat_repo: Arc<dyn ChatRepository>) -> Self {
        Self { chat_repo }
    }

    pub async fn execute(&self, user_id: Uuid) -> Result<Vec<Chat>> {
        self.chat_repo.find_by_user_id(user_id).await
    }
}
