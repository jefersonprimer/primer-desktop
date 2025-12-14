use std::sync::Arc;
use anyhow::Result;
use crate::domain::ai::chat::{
    service::{chat_service::ChatService, chat_service::ChatServiceRequest},
    entity::message::Message,
};

pub struct SendMessageUseCase {
    chat_service: Arc<dyn ChatService>,
}

impl SendMessageUseCase {
    pub fn new(chat_service: Arc<dyn ChatService>) -> Self {
        Self { chat_service }
    }

    pub async fn execute(&self, request: ChatServiceRequest) -> Result<(Message, Vec<String>)> {
        self.chat_service.send_message_to_ai(request).await
    }
}