// backend/src/domain/ai/provider/openai.rs

use std::sync::Arc;
use crate::domain::ai::provider::AiProvider;

pub fn new_openai_provider(_model_name: String) -> Arc<dyn AiProvider> {
    // Placeholder for OpenAI provider.
    // This should be replaced with actual implementation when needed.
    Arc::new(UnimplementedAiProvider)
}

struct UnimplementedAiProvider;

use async_trait::async_trait;
use anyhow::{Result, anyhow};
use crate::domain::ai::provider::{ChatCompletionRequest, ChatCompletionResponse};

#[async_trait]
impl AiProvider for UnimplementedAiProvider {
    async fn chat_completion(&self, _api_key: &str, _request: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        Err(anyhow!("OpenAI provider is not yet implemented."))
    }
}
