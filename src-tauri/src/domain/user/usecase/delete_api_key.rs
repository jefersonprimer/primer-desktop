use std::sync::Arc;
use anyhow::Result;
use uuid::Uuid;
use crate::domain::user::{
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct DeleteApiKeyUseCase {
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
}

impl DeleteApiKeyUseCase {
    pub fn new(user_api_key_repo: Arc<dyn UserApiKeyRepository>) -> Self {
        Self { user_api_key_repo }
    }

    pub async fn execute(&self, api_key_id: Uuid) -> Result<()> {
        self.user_api_key_repo.delete(api_key_id).await
    }
}