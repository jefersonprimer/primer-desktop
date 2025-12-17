use async_trait::async_trait;
use anyhow::Result;
use uuid::Uuid;
use crate::domain::ai::chat::entity::message::Message;

use std::str::FromStr; // Add this import

// Enum to represent available AI providers
pub enum AIProviderType {
    Gemini,
    OpenAI,
    OpenRouter,
}

impl FromStr for AIProviderType {
    type Err = anyhow::Error; // Or a more specific error type if preferred

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "gemini" => Ok(AIProviderType::Gemini),
            "openai" => Ok(AIProviderType::OpenAI),
            "openrouter" => Ok(AIProviderType::OpenRouter),
            _ => Err(anyhow::anyhow!("Unknown AI provider type: {}", s)), // Use anyhow for error
        }
    }
}

impl AIProviderType {
    pub fn to_string_key(&self) -> String {
        match self {
            AIProviderType::Gemini => "gemini".to_string(),
            AIProviderType::OpenAI => "openai".to_string(),
            AIProviderType::OpenRouter => "openrouter".to_string(),
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
    pub image: Option<String>,
}

#[async_trait]
pub trait ChatService: Send + Sync {
    async fn send_message_to_ai(&self, request: ChatServiceRequest) -> Result<(Message, Vec<String>)>;
}

