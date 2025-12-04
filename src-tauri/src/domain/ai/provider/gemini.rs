// backend/src/domain/ai/provider/gemini.rs

use std::sync::Arc;
use crate::domain::ai::provider::AiProvider;
use crate::infrastructure::ai::provider::gemini::GeminiClient; // Correct path to GeminiClient

pub fn new_gemini_provider(model_name: String) -> Arc<dyn AiProvider> {
    Arc::new(GeminiClient::new(model_name))
}
