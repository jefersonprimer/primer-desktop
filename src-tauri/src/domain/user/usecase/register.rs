use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    entity::user::User,
    repository::user_repository::UserRepository,
    service::password_hasher::PasswordHasher,
};

pub struct RegisterUseCase {
    user_repo: Arc<dyn UserRepository>,
    hasher: Arc<dyn PasswordHasher>,
}

impl RegisterUseCase {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        hasher: Arc<dyn PasswordHasher>,
    ) -> Self {
        Self { user_repo, hasher }
    }

    pub async fn execute(&self, email: String, password: String) -> Result<User> {
        if self.user_repo.find_by_email(&email).await?.is_some() {
            return Err(anyhow!("Email already registered"));
        }

        let password_hash = self.hasher.hash(&password)?;

        let new_user = User {
            id: Uuid::new_v4(),
            email,
            password_hash,
            google_id: None,
            full_name: None,
            profile_picture: None,
            plan: "free".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        self.user_repo.create(new_user).await
    }
}