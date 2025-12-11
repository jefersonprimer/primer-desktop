// backend/src/infrastructure/ai/provider/gemini.rs

use async_trait::async_trait;
use anyhow::{Result, anyhow};
use reqwest::Client;
use crate::domain::ai::provider::{
    AiProvider, ChatCompletionRequest, ChatCompletionResponse, ChatMessage, ChatCompletionChoice, ChatCompletionUsage
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

const GEMINI_API_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models";

// Intermediate struct to match Gemini's request format
#[derive(Debug, Serialize)]
struct GeminiChatRequest {
    contents: Vec<GeminiContent>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "generationConfig")]
    generation_config: Option<GenerationConfig>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerationConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_output_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)] // Deserialize added for response content parsing
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiPart {
    #[serde(skip_serializing_if = "Option::is_none")]
    text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    inline_data: Option<GeminiInlineData>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiInlineData {
    mime_type: String,
    data: String,
}

// Intermediate struct to match Gemini's response format
#[derive(Debug, Deserialize)]
struct GeminiChatResponse {
    candidates: Option<Vec<GeminiCandidate>>, // Made optional just in case
    usage_metadata: Option<GeminiUsageMetadata>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
    #[serde(rename = "finishReason")]
    finish_reason: Option<String>,
    #[serde(rename = "safetyRatings")]
    #[allow(dead_code)]
    safety_ratings: Option<Vec<GeminiSafetyRating>>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct GeminiSafetyRating {
    category: String,
    probability: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiUsageMetadata {
    prompt_token_count: u32,
    candidates_token_count: Option<u32>, // Made optional as it might not always be present or be 0
    total_token_count: u32,
}

pub struct GeminiClient {
    client: Client,
    model_name: String,
}

impl GeminiClient {
    pub fn new(model_name: String) -> Self {
        GeminiClient {
            client: Client::new(),
            model_name,
        }
    }
}

#[async_trait]
impl AiProvider for GeminiClient {
    async fn chat_completion(&self, api_key: &str, request: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        let model = if request.model.is_empty() {
            &self.model_name
        } else {
            &request.model
        };
        let url = format!("{}/{}:generateContent", GEMINI_API_BASE_URL, model);

        let generation_config = if request.temperature.is_some() || request.max_tokens.is_some() {
            Some(GenerationConfig {
                temperature: request.temperature,
                max_output_tokens: request.max_tokens,
            })
        } else {
            None
        };

        let gemini_request = GeminiChatRequest {
            contents: request.messages.into_iter().map(|msg| {
                // Gemini API expects roles "user" and "model".
                // Our domain ChatMessage uses "user" and "assistant".
                // We need to map "assistant" to "model".
                let role = if msg.role == "assistant" { "model".to_string() } else { msg.role };
                
                let mut parts = Vec::new();
                
                if !msg.content.is_empty() {
                    parts.push(GeminiPart { 
                        text: Some(msg.content),
                        inline_data: None,
                    });
                }
                
                if let Some(img_data) = msg.image {
                     // Parse data URL: data:image/png;base64,....
                     if let Some(comma_pos) = img_data.find(',') {
                         let header = &img_data[..comma_pos];
                         let data = &img_data[comma_pos + 1..];
                         
                         let mime_type = if header.contains("png") {
                             "image/png"
                         } else if header.contains("jpeg") || header.contains("jpg") {
                             "image/jpeg"
                         } else if header.contains("webp") {
                             "image/webp"
                         } else {
                             "image/png" // Fallback
                         };
                         
                         parts.push(GeminiPart {
                             text: None,
                             inline_data: Some(GeminiInlineData {
                                 mime_type: mime_type.to_string(),
                                 data: data.to_string(),
                             }),
                         });
                     }
                }
                
                GeminiContent {
                    role,
                    parts,
                }
            }).collect(),
            generation_config,
        };

        let response = self.client.post(&url)
            .header("x-goog-api-key", api_key)
            .json(&gemini_request)
            .send()
            .await?;

        let status = response.status();
        let response_text = response.text().await?;

        if !status.is_success() {
            return Err(anyhow!("Gemini API error: Status {}, Response: {}", status, response_text));
        }

        let gemini_response: GeminiChatResponse = serde_json::from_str(&response_text)
            .map_err(|e| anyhow!("Failed to parse Gemini API response: {} - Raw: {}", e, response_text))?;

        if gemini_response.candidates.is_none() {
             return Err(anyhow!("Gemini API returned no candidates. Raw: {}", response_text));
        }

        // Convert GeminiChatResponse to domain::ChatCompletionResponse
        let choices: Result<Vec<ChatCompletionChoice>> = gemini_response.candidates.unwrap().into_iter().enumerate().map(|(i, candidate)| {
            if candidate.content.parts.is_empty() {
                return Err(anyhow!("Gemini candidate content parts are empty"));
            }
            // Gemini API response role is "model", convert back to "assistant" for our domain
            let role = if candidate.content.role == "model" { "assistant".to_string() } else { candidate.content.role };

            // Find the first text part
            let content = candidate.content.parts.iter()
                .find_map(|p| p.text.clone())
                .unwrap_or_default();

            Ok(ChatCompletionChoice {
                index: i as u32,
                message: ChatMessage {
                    role,
                    content,
                    image: None, // Response doesn't have image
                },
                finish_reason: candidate.finish_reason.unwrap_or_else(|| "stop".to_string()),
            })
        }).collect();

        let choices = choices?;

        let usage = gemini_response.usage_metadata.map(|metadata| {
            ChatCompletionUsage {
                prompt_tokens: metadata.prompt_token_count,
                completion_tokens: metadata.candidates_token_count.unwrap_or(0),
                total_tokens: metadata.total_token_count,
            }
        }).unwrap_or_else(|| {
            // Default usage if not provided, though less accurate
            ChatCompletionUsage {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            }
        });

        Ok(ChatCompletionResponse {
            id: Uuid::new_v4().to_string(), // Gemini API might not return a direct ID for the response, generate one
            model: self.model_name.clone(),
            created: Utc::now().timestamp() as u64, // Use current time
            choices,
            usage,
        })
    }
}