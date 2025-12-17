use async_trait::async_trait;
use anyhow::{Result, anyhow};
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use serde::Deserialize;
use crate::domain::ai::provider::{
    AiProvider, ChatCompletionRequest, ChatMessage,
};
use crate::domain::ai::chat::repository::message_repository::MessageRepository;
use crate::domain::ai::chat::repository::chat_repository::ChatRepository;
use crate::domain::prompt_preset::repository::PromptPresetRepository;
use crate::domain::ai::chat::entity::message::Message;
use crate::domain::ai::chat::service::{
    chat_service::{ChatService, ChatServiceRequest, AIProviderType},
};
use crate::domain::user::repository::user_api_key_repository::UserApiKeyRepository;

#[derive(Deserialize)]
struct AiResponse {
    answer: String,
    follow_ups: Vec<String>,
}

pub struct ChatServiceImpl {
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    message_repo: Arc<dyn MessageRepository>,
    chat_repo: Arc<dyn ChatRepository>,
    prompt_preset_repo: Arc<dyn PromptPresetRepository>,
    gemini_provider: Arc<dyn AiProvider>,
    openai_provider: Arc<dyn AiProvider>,
    openrouter_provider: Arc<dyn AiProvider>,
}

impl ChatServiceImpl {
    pub fn new(
        user_api_key_repo: Arc<dyn UserApiKeyRepository>,
        message_repo: Arc<dyn MessageRepository>,
        chat_repo: Arc<dyn ChatRepository>,
        prompt_preset_repo: Arc<dyn PromptPresetRepository>,
        gemini_provider: Arc<dyn AiProvider>,
        openai_provider: Arc<dyn AiProvider>,
        openrouter_provider: Arc<dyn AiProvider>,
    ) -> Self {
        Self {
            user_api_key_repo,
            message_repo,
            chat_repo,
            prompt_preset_repo,
            gemini_provider,
            openai_provider,
            openrouter_provider,
        }
    }
}



#[async_trait]
impl ChatService for ChatServiceImpl {
    async fn send_message_to_ai(&self, request: ChatServiceRequest) -> Result<(Message, Vec<String>)> {
        // 1. Get user's API key
        let user_api_keys = self.user_api_key_repo.find_by_user_id(request.user_id).await?;
        let provider_type = request.provider_name.parse::<AIProviderType>() // Changed from AIProviderType::from_str
            .map_err(|e| anyhow!("Unsupported AI provider: {}", e))?; // Handle error from parse

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

        // Fetch chat and preset
        let chat = self.chat_repo.find_by_id(request.chat_id).await?
            .ok_or_else(|| anyhow!("Chat not found"))?;
        
        let mut system_prompt = None;
        if let Some(preset_id) = chat.prompt_preset_id {
             if let Some(preset) = self.prompt_preset_repo.find_by_id(&preset_id).await? {
                 system_prompt = Some(preset.prompt);
             }
        }

        // 3. Fetch previous messages from the chat to provide context
        let previous_messages = self.message_repo.find_by_chat_id(request.chat_id).await?;
        
        // Convert previous messages to ChatMessage format for the AI provider
        let mut chat_messages: Vec<ChatMessage> = Vec::new();

        let json_instruction = "\n\nApós responder o usuário:\n- Gere de 3 a 4 perguntas de follow-up\n- As perguntas devem ajudar a avançar tecnicamente\n- Não repita informações já dadas\n- Se não houver follow-ups úteis, retorne uma lista vazia\n- As perguntas devem ser curtas e objetivas\n\nResponda em JSON no formato:\n{\n  \"answer\": string,\n  \"follow_ups\": string[]\n}";

        if let Some(prompt) = system_prompt {
             chat_messages.push(ChatMessage {
                 role: "system".to_string(),
                 content: format!("{}{}", prompt, json_instruction),
                 image: None,
             });
        } else {
             chat_messages.push(ChatMessage {
                 role: "system".to_string(),
                 content: json_instruction.to_string(),
                 image: None,
             });
        }

        let history_messages: Vec<ChatMessage> = previous_messages
            .iter()
            .map(|msg| {
                let image = if msg.id == user_message.id {
                    request.image.clone()
                } else {
                    None
                };
                ChatMessage {
                    role: msg.role.clone(),
                    content: msg.content.clone(),
                    image,
                }
            })
            .collect();
        
        chat_messages.extend(history_messages);

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
            AIProviderType::OpenRouter => self.openrouter_provider.chat_completion(api_key, chat_req).await?,
        };

        // 5. Extract AI response content
        let ai_response_message_content = ai_response.choices.first() // Changed .get(0) to .first()
            .map(|choice| choice.message.content.clone()) // Changed .and_then to .map
            .ok_or_else(|| anyhow!("No response from AI"))?;
        
        let ai_response_message_role = ai_response.choices.first() // Changed .get(0) to .first()
            .map(|choice| choice.message.role.clone()) // Changed .and_then to .map
            .unwrap_or_else(|| "assistant".to_string()); // Default to "assistant"

        // Parse JSON response
        let (content, follow_ups) = match serde_json::from_str::<AiResponse>(&ai_response_message_content) {
            Ok(parsed) => (parsed.answer, parsed.follow_ups),
            Err(_) => {
                    // Try to strip markdown code blocks if present ```json ... ```
                    let clean_content = ai_response_message_content.trim();
                    let clean_content = if clean_content.starts_with("```json") {
                        clean_content.trim_start_matches("```json").trim_end_matches("```").trim()
                    } else if clean_content.starts_with("```") {
                        clean_content.trim_start_matches("```").trim_end_matches("```").trim()
                    } else {
                        clean_content
                    };
                    
                    match serde_json::from_str::<AiResponse>(clean_content) {
                        Ok(parsed) => (parsed.answer, parsed.follow_ups),
                        Err(_) => (ai_response_message_content.clone(), vec![]) // Fallback to original
                    }
            }
        };

        // 6. Save AI response to message repository (only content)
        let ai_message = Message {
            id: Uuid::new_v4(),
            chat_id: request.chat_id,
            role: ai_response_message_role,
            content: content,
            created_at: Utc::now(),
        };

        self.message_repo.create(ai_message.clone()).await?;

        Ok((ai_message, follow_ups))
    }
}
