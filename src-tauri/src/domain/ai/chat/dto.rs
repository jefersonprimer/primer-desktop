use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateChatDto {
    pub user_id: String,
    pub title: Option<String>,
    pub prompt_preset_id: Option<String>,
    pub model: Option<String>,
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
    pub image: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MessageDto {
    pub id: String,
    pub chat_id: String,
    pub user_id: Option<String>,
    pub role: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendMessageResponse {
    pub message: MessageDto,
    pub follow_ups: Vec<String>,
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

#[derive(Debug, Deserialize, Serialize)]
pub struct GetChatsDto {
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatDto {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub model: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetChatsResponse {
    pub chats: Vec<ChatDto>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetMessagesDto {
    pub chat_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetMessagesResponse {
    pub messages: Vec<MessageDto>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteChatDto {
    pub chat_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteChatResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteAllChatsDto {
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteAllChatsResponse {
    pub message: String,
}
