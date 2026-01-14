use uuid::Uuid;
use anyhow::Result;
use std::sync::Arc;
use crate::domain::user::{
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct DeleteApiKeyUseCase {
    repo: Arc<dyn UserApiKeyRepository>,
}

impl DeleteApiKeyUseCase {
    pub fn new(repo: Arc<dyn UserApiKeyRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, id: Uuid) -> Result<()> {
        self.repo.delete(id).await
    }
}
