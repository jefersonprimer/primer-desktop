use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateChatDto {
    pub user_id: String,
    pub title: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateChatResponse {
    pub chat_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendMessageDto {
    pub user_id: String,
    pub chat_id: String,
    pub content: String,
    pub provider_name: String,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MessageDto {
    pub id: String,
    pub chat_id: String,
    pub user_id: String,
    pub role: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendMessageResponse {
    pub message: MessageDto,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SyncMessagesDto {
    pub user_id: String,
    pub chat_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SyncMessagesResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BackupChatDto {
    pub user_id: String,
    pub chat_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BackupChatResponse {
    pub message: String,
}
