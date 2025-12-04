use async_trait::async_trait;
use anyhow::{Result, anyhow};
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use crate::domain::ai::provider::{
    AiProvider, ChatCompletionRequest, ChatMessage,
};
use crate::domain::ai::chat::repository::message_repository::MessageRepository;
use crate::domain::ai::chat::entity::message::Message;
use crate::domain::ai::chat::service::{
    chat_service::{ChatService, ChatServiceRequest, AIProviderType},
};
use crate::domain::user::repository::user_api_key_repository::UserApiKeyRepository;


pub struct ChatServiceImpl {
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    message_repo: Arc<dyn MessageRepository>, // This will be the main message repo (e.g., SQLite)
    gemini_provider: Arc<dyn AiProvider>,
    openai_provider: Arc<dyn AiProvider>,
    claude_provider: Arc<dyn AiProvider>,
}

impl ChatServiceImpl {
    pub fn new(
        user_api_key_repo: Arc<dyn UserApiKeyRepository>,
        message_repo: Arc<dyn MessageRepository>,
        gemini_provider: Arc<dyn AiProvider>,
        openai_provider: Arc<dyn AiProvider>,
        claude_provider: Arc<dyn AiProvider>,
    ) -> Self {
        Self {
            user_api_key_repo,
            message_repo,
            gemini_provider,
            openai_provider,
            claude_provider,
        }
    }
}

#[async_trait]
impl ChatService for ChatServiceImpl {
    async fn send_message_to_ai(&self, request: ChatServiceRequest) -> Result<Message> {
        // 1. Get user's API key
        let user_api_keys = self.user_api_key_repo.find_by_user_id(request.user_id).await?;
        let provider_type = AIProviderType::from_str(&request.provider_name)
            .ok_or_else(|| anyhow!("Unsupported AI provider: {}", request.provider_name))?;

        let api_key_entry = user_api_keys.iter()
            .find(|key| key.provider == provider_type.to_string_key())
            .ok_or_else(|| anyhow!("API key not found for provider: {}", request.provider_name))?;
        
        let api_key = &api_key_entry.api_key;

        // 2. Save user's message first
        let user_message = Message {
            id: Uuid::new_v4(),
            chat_id: request.chat_id,
            role: "user".to_string(),
            content: request.prompt.clone(),
            created_at: Utc::now(),
        };
        self.message_repo.create(user_message.clone()).await?;

        // 3. Fetch previous messages from the chat to provide context
        let previous_messages = self.message_repo.find_by_chat_id(request.chat_id).await?;
        
        // Convert previous messages to ChatMessage format for the AI provider
        // We'll include all previous messages (which now includes the user message we just saved)
        let chat_messages: Vec<ChatMessage> = previous_messages
            .iter()
            .map(|msg| ChatMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        let chat_req = ChatCompletionRequest {
            model: request.model.clone(),
            messages: chat_messages,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
        };

        // 4. Select and call AI provider
        let ai_response = match provider_type {
            AIProviderType::Gemini => self.gemini_provider.chat_completion(api_key, chat_req).await?,
            AIProviderType::OpenAI => self.openai_provider.chat_completion(api_key, chat_req).await?,
            AIProviderType::Claude => self.claude_provider.chat_completion(api_key, chat_req).await?,
        };

        // 5. Extract AI response content
        let ai_response_message_content = ai_response.choices.get(0)
            .and_then(|choice| Some(choice.message.content.clone()))
            .ok_or_else(|| anyhow!("No response from AI"))?;
        
        let ai_response_message_role = ai_response.choices.get(0)
            .and_then(|choice| Some(choice.message.role.clone()))
            .unwrap_or_else(|| "assistant".to_string()); // Default to "assistant"

        // 6. Save AI response to message repository
        let ai_message = Message {
            id: Uuid::new_v4(),
            chat_id: request.chat_id,
            role: ai_response_message_role,
            content: ai_response_message_content,
            created_at: Utc::now(),
        };

        self.message_repo.create(ai_message.clone()).await?;

        Ok(ai_message)
    }
}
