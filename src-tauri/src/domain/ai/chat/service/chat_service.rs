use async_trait::async_trait;
use anyhow::Result;
use uuid::Uuid;
use crate::domain::ai::chat::entity::message::Message;

// Enum to represent available AI providers
pub enum AIProviderType {
    Gemini,
    OpenAI,
    Claude,
}

impl AIProviderType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "gemini" => Some(AIProviderType::Gemini),
            "openai" => Some(AIProviderType::OpenAI),
            "claude_code" | "claude" => Some(AIProviderType::Claude),
            _ => None,
        }
    }
    pub fn to_string_key(&self) -> String {
        match self {
            AIProviderType::Gemini => "gemini".to_string(),
            AIProviderType::OpenAI => "openai".to_string(),
            AIProviderType::Claude => "claude_code".to_string(),
        }
    }
}

pub struct ChatServiceRequest {
    pub user_id: Uuid,
    pub chat_id: Uuid,
    pub provider_name: String,
    pub prompt: String,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[async_trait]
pub trait ChatService: Send + Sync {
    async fn send_message_to_ai(&self, request: ChatServiceRequest) -> Result<Message>;
}

