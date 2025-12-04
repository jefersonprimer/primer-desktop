use std::sync::Arc;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    repository::user_repository::UserRepository,
    service::password_hasher::PasswordHasher,
};

pub struct DeleteAccountUseCase {
    user_repo: Arc<dyn UserRepository>,
    hasher: Arc<dyn PasswordHasher>,
}

impl DeleteAccountUseCase {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        hasher: Arc<dyn PasswordHasher>,
    ) -> Self {
        Self { user_repo, hasher }
    }

    pub async fn execute(&self, user_id: Uuid, password: String) -> Result<()> {
        let user = self.user_repo.find_by_id(user_id).await?
            .ok_or_else(|| anyhow!("User not found"))?;

        if !self.hasher.verify(&user.password_hash, &password)? {
             return Err(anyhow!("Invalid password"));
        }

        // Here we could also trigger cleanup events for other domains
        self.user_repo.delete(user_id).await
    }
}
