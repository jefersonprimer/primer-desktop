use std::sync::Arc;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    repository::{user_repository::UserRepository, session_repository::SessionRepository},
    service::{password_hasher::PasswordHasher, token_generator::TokenGenerator},
    entity::session::Session,
};

pub struct LoginUseCase {
    user_repo: Arc<dyn UserRepository>,
    hasher: Arc<dyn PasswordHasher>,
    token_gen: Arc<dyn TokenGenerator>,
    session_repo: Arc<dyn SessionRepository>,
}

impl LoginUseCase {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        hasher: Arc<dyn PasswordHasher>,
        token_gen: Arc<dyn TokenGenerator>,
        session_repo: Arc<dyn SessionRepository>,
    ) -> Self {
        Self { user_repo, hasher, token_gen, session_repo }
    }

    pub async fn execute(&self, email: String, password: String) -> Result<(String, String)> {
        let user = self.user_repo.find_by_email(&email).await?
            .ok_or_else(|| anyhow!("Invalid email or password"))?;

        if !self.hasher.verify(&user.password_hash, &password)? {
            return Err(anyhow!("Invalid email or password"));
        }

        let token = self.token_gen.generate_token(user.id)?;
        
        // Decode token to get expiration time
        let claims = self.token_gen.decode_token(&token)?;
        let expires_at = claims.exp as i64;

        // Save session to SQLite
        let session = Session {
            id: 1,
            user_id: user.id,
            access_token: token.clone(),
            refresh_token: None,
            google_access_token: None,
            expires_at,
        };
        self.session_repo.save(session).await?;

        Ok((token, user.id.to_string()))
    }
}