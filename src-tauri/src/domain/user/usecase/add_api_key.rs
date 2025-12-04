use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use chrono::Utc;
use crate::domain::user::{
    entity::user_api_key::UserApiKey,
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct AddApiKeyUseCase {
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
}

impl AddApiKeyUseCase {
    pub fn new(user_api_key_repo: Arc<dyn UserApiKeyRepository>) -> Self {
        Self { user_api_key_repo }
    }

    pub async fn execute(&self, user_id: Uuid, provider: String, api_key_value: String) -> Result<UserApiKey> {
        // Basic validation for provider
        if !["openai", "gemini", "claude_code"].contains(&provider.as_str()) {
            return Err(anyhow!("Invalid AI provider specified."));
        }

        // Check if an API key for this provider already exists for the user
        let existing_keys = self.user_api_key_repo.find_by_user_id(user_id).await?;
        if existing_keys.iter().any(|key| key.provider == provider) {
            return Err(anyhow!("User already has an API key for this provider."));
        }

        let new_api_key = UserApiKey {
            id: Uuid::new_v4(),
            user_id,
            provider,
            api_key: api_key_value,
            created_at: Utc::now(),
        };

        self.user_api_key_repo.create(new_api_key).await
    }
}