use std::sync::Arc;
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use crate::domain::ai::chat::{
    entity::chat::Chat,
    repository::chat_repository::ChatRepository,
};

pub struct CreateChatUseCase {
    chat_repo: Arc<dyn ChatRepository>,
}

impl CreateChatUseCase {
    pub fn new(chat_repo: Arc<dyn ChatRepository>) -> Self {
        Self { chat_repo }
    }

            pub async fn execute(&self, user_id: Uuid, title: Option<String>, prompt_preset_id: Option<String>, model: Option<String>) -> Result<Chat> {

                let new_chat = Chat {

                    id: Uuid::new_v4(),

                    user_id,

                    title,

                    prompt_preset_id,

                    model,

                    created_at: Utc::now(),

                    updated_at: Utc::now(),

                };

        

                self.chat_repo.create(new_chat).await

            }

        

    }

    