use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::domain::ai::provider::{AiProvider, ChatCompletionRequest, ChatMessage, ChatCompletionResponse, ChatCompletionChoice, ChatCompletionUsage};

#[derive(Debug, Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ClaudeChatCompletionRequest {
    model: String,
    max_tokens: u32, // Required for Claude
    messages: Vec<ClaudeMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
}

#[derive(Debug, Deserialize)]
struct ClaudeChatCompletionResponse {
    id: String,
    // type: String,
    role: String, // Claude's response role
    model: String,
    #[serde(default)]
    stop_sequence: Option<String>,
    usage: ClaudeChatCompletionUsage,
    content: Vec<ClaudeContentBlock>,
}

#[derive(Debug, Deserialize)]
struct ClaudeChatCompletionUsage {
    input_tokens: u32,
    output_tokens: u32,
}

#[derive(Debug, Deserialize)]
struct ClaudeContentBlock {
    #[serde(rename = "type")]
    block_type: String, // e.g., "text"
    text: String,
}

pub struct ClaudeProvider {
    client: Client,
}

impl ClaudeProvider {
    pub fn new() -> Self {
        Self { client: Client::new() }
    }
}

#[async_trait]
impl AiProvider for ClaudeProvider {
    async fn chat_completion(&self, api_key: &str, request: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        let claude_messages: Vec<ClaudeMessage> = request.messages.into_iter().map(|msg| ClaudeMessage {
            role: msg.role,
            content: msg.content,
        }).collect();

        // Claude requires max_tokens, so use a default if not provided
        let max_tokens = request.max_tokens.unwrap_or(1024);

        let claude_request = ClaudeChatCompletionRequest {
            model: request.model,
            max_tokens,
            messages: claude_messages,
            temperature: request.temperature,
        };

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01") // Required by Anthropic
            .header("Content-Type", "application/json")
            .json(&claude_request)
            .send()
            .await?
            .error_for_status()?
            .json::<ClaudeChatCompletionResponse>()
            .await?;

        // Extract content from Claude's response (assuming it's a single text block for now)
        let content_text = response.content.into_iter()
            .filter(|block| block.block_type == "text")
            .map(|block| block.text)
            .collect::<Vec<String>>()
            .join("\n"); // Join multiple text blocks with newline

        Ok(ChatCompletionResponse {
            id: response.id,
            model: response.model,
            created: chrono::Utc::now().timestamp() as u64, // Claude response doesn't have 'created' timestamp
            choices: vec![
                ChatCompletionChoice {
                    index: 0,
                    message: ChatMessage {
                        role: response.role,
                        content: content_text,
                    },
                    finish_reason: response.stop_sequence.unwrap_or("STOP".to_string()),
                },
            ],
            usage: ChatCompletionUsage {
                prompt_tokens: response.usage.input_tokens,
                completion_tokens: response.usage.output_tokens,
                total_tokens: response.usage.input_tokens + response.usage.output_tokens,
            },
        })
    }
}
