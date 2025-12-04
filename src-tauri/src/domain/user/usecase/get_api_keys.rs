use std::sync::Arc;
use anyhow::Result;
use uuid::Uuid;
use crate::domain::user::{
    entity::user_api_key::UserApiKey,
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct GetApiKeysUseCase {
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
}

impl GetApiKeysUseCase {
    pub fn new(user_api_key_repo: Arc<dyn UserApiKeyRepository>) -> Self {
        Self { user_api_key_repo }
    }

    pub async fn execute(&self, user_id: Uuid) -> Result<Vec<UserApiKey>> {
        self.user_api_key_repo.find_by_user_id(user_id).await
    }
}