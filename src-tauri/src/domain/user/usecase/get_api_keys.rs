use uuid::Uuid;
use anyhow::Result;
use std::sync::Arc;
use crate::domain::user::{
    entity::user_api_key::UserApiKey,
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct GetApiKeysUseCase {
    repo: Arc<dyn UserApiKeyRepository>,
}

impl GetApiKeysUseCase {
    pub fn new(repo: Arc<dyn UserApiKeyRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, user_id: Uuid) -> Result<Vec<UserApiKey>> {
        self.repo.find_by_user_id(user_id).await
    }
}
