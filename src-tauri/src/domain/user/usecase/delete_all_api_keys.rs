use std::sync::Arc;
use uuid::Uuid;
use anyhow::Result;
use crate::domain::user::repository::user_api_key_repository::UserApiKeyRepository;

pub struct DeleteAllApiKeysUseCase {
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
}

impl DeleteAllApiKeysUseCase {
    pub fn new(user_api_key_repo: Arc<dyn UserApiKeyRepository>) -> Self {
        Self { user_api_key_repo }
    }

    pub async fn execute(&self, user_id: Uuid) -> Result<()> {
        self.user_api_key_repo.delete_all_by_user_id(user_id).await
    }
}
