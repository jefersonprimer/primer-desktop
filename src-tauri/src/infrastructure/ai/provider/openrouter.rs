use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::domain::ai::provider::{AiProvider, ChatCompletionRequest, ChatMessage, ChatCompletionResponse, ChatCompletionChoice, ChatCompletionUsage};

#[derive(Debug, Serialize, Deserialize)]
struct OpenRouterChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct OpenRouterChatCompletionRequest {
    model: String,
    messages: Vec<OpenRouterChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct OpenRouterChatCompletionResponse {
    id: String,
    // object: String,
    created: u64,
    model: String,
    choices: Vec<OpenRouterChatCompletionChoice>,
    usage: OpenRouterChatCompletionUsage,
}

#[derive(Debug, Deserialize)]
struct OpenRouterChatCompletionChoice {
    index: u32,
    message: OpenRouterChatMessage,
    finish_reason: Option<String>, // OpenRouter sometimes returns null for finish_reason
}

#[derive(Debug, Deserialize)]
struct OpenRouterChatCompletionUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

pub struct OpenRouterProvider {
    client: Client,
}

impl OpenRouterProvider {
    pub fn new() -> Self {
        Self { client: Client::new() }
    }
}

impl Default for OpenRouterProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AiProvider for OpenRouterProvider {
    async fn chat_completion(&self, api_key: &str, request: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        let openrouter_messages: Vec<OpenRouterChatMessage> = request.messages.into_iter().map(|msg| OpenRouterChatMessage {
            role: msg.role,
            content: msg.content,
        }).collect();

        let openrouter_request = OpenRouterChatCompletionRequest {
            model: request.model,
            messages: openrouter_messages,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
        };

        let response = self.client
            .post("https://openrouter.ai/api/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("HTTP-Referer", "https://primer-ai.app") // Recommended by OpenRouter
            .header("X-Title", "Primer AI") // Recommended by OpenRouter
            .json(&openrouter_request)
            .send()
            .await?
            .error_for_status()?
            .json::<OpenRouterChatCompletionResponse>()
            .await?;

        // Map OpenRouter response to generic ChatCompletionResponse
        let choices: Vec<ChatCompletionChoice> = response.choices.into_iter().map(|choice| ChatCompletionChoice {
            index: choice.index,
            message: ChatMessage {
                role: choice.message.role,
                content: choice.message.content,
            },
            finish_reason: choice.finish_reason.unwrap_or_else(|| "stop".to_string()),
        }).collect();

        Ok(ChatCompletionResponse {
            id: response.id,
            model: response.model,
            created: response.created,
            choices,
            usage: ChatCompletionUsage {
                prompt_tokens: response.usage.prompt_tokens,
                completion_tokens: response.usage.completion_tokens,
                total_tokens: response.usage.total_tokens,
            },
        })
    }
}
