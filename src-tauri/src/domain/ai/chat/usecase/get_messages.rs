use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;
use crate::domain::ai::chat::{
    entity::message::Message,
    repository::message_repository::MessageRepository,
};

pub struct GetMessagesUseCase {
    message_repo: Arc<dyn MessageRepository>,
}

impl GetMessagesUseCase {
    pub fn new(message_repo: Arc<dyn MessageRepository>) -> Self {
        Self { message_repo }
    }

    pub async fn execute(&self, chat_id: Uuid) -> Result<Vec<Message>> {
        self.message_repo.find_by_chat_id(chat_id).await
    }
}
