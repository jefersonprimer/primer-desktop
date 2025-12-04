use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::domain::ai::provider::{AiProvider, ChatCompletionRequest, ChatMessage, ChatCompletionResponse, ChatCompletionChoice, ChatCompletionUsage};

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct OpenAIChatCompletionRequest {
    model: String,
    messages: Vec<OpenAIChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChatCompletionResponse {
    id: String,
    // object: String,
    created: u64,
    model: String,
    choices: Vec<OpenAIChatCompletionChoice>,
    usage: OpenAIChatCompletionUsage,
}

#[derive(Debug, Deserialize)]
struct OpenAIChatCompletionChoice {
    index: u32,
    message: OpenAIChatMessage,
    finish_reason: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIChatCompletionUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

pub struct OpenAIProvider {
    client: Client,
}

impl OpenAIProvider {
    pub fn new() -> Self {
        Self { client: Client::new() }
    }
}

#[async_trait]
impl AiProvider for OpenAIProvider {
    async fn chat_completion(&self, api_key: &str, request: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        let openai_messages: Vec<OpenAIChatMessage> = request.messages.into_iter().map(|msg| OpenAIChatMessage {
            role: msg.role,
            content: msg.content,
        }).collect();

        let openai_request = OpenAIChatCompletionRequest {
            model: request.model,
            messages: openai_messages,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
        };

        let response = self.client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&openai_request)
            .send()
            .await?
            .error_for_status()?
            .json::<OpenAIChatCompletionResponse>()
            .await?;

        // Map OpenAI response to generic ChatCompletionResponse
        let choices: Vec<ChatCompletionChoice> = response.choices.into_iter().map(|choice| ChatCompletionChoice {
            index: choice.index,
            message: ChatMessage {
                role: choice.message.role,
                content: choice.message.content,
            },
            finish_reason: choice.finish_reason,
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
