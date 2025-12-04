use std::sync::Arc;
use anyhow::Result;
use uuid::Uuid;
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

    pub async fn execute(&self, user_id: Uuid, chat_id: Uuid, provider_name: String, prompt: String, model: String, temperature: Option<f32>, max_tokens: Option<u32>) -> Result<Message> {
        let request = ChatServiceRequest {
            user_id,
            chat_id,
            provider_name,
            prompt,
            model,
            temperature,
            max_tokens,
        };
        self.chat_service.send_message_to_ai(request).await
    }
}