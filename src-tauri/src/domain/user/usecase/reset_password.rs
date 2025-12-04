use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    repository::user_repository::UserRepository,
    service::{token_generator::TokenGenerator, password_hasher::PasswordHasher},
};

pub struct ResetPasswordUseCase {
    user_repo: Arc<dyn UserRepository>,
    token_gen: Arc<dyn TokenGenerator>,
    hasher: Arc<dyn PasswordHasher>,
}

impl ResetPasswordUseCase {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        token_gen: Arc<dyn TokenGenerator>,
        hasher: Arc<dyn PasswordHasher>,
    ) -> Self {
        Self { user_repo, token_gen, hasher }
    }

    pub async fn execute(&self, token: String, new_password: String) -> Result<()> {
        let claims = self.token_gen.decode_token(&token)?;
        let user_id = Uuid::parse_str(&claims.sub)?;

        let mut user = self.user_repo.find_by_id(user_id).await?
            .ok_or_else(|| anyhow!("User not found"))?;

        let password_hash = self.hasher.hash(&new_password)?;
        
        user.password_hash = password_hash;
        user.updated_at = Utc::now();

        self.user_repo.update(user).await?;
        Ok(())
    }
}
