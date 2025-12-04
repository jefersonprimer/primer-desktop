use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionRequestDto {
    pub chat_id: Uuid,
    pub provider_name: String,
    pub prompt: String,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionResponseDto {
    pub message_id: Uuid,
    pub chat_id: Uuid,
    pub role: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}
