use std::sync::Arc;
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use crate::domain::user::{
    repository::{user_repository::UserRepository, session_repository::SessionRepository},
    service::token_generator::TokenGenerator,
    entity::{user::User, session::Session},
};

pub struct GoogleLoginUseCase {
    user_repo: Arc<dyn UserRepository>,
    token_gen: Arc<dyn TokenGenerator>,
    session_repo: Arc<dyn SessionRepository>,
}

impl GoogleLoginUseCase {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        token_gen: Arc<dyn TokenGenerator>,
        session_repo: Arc<dyn SessionRepository>,
    ) -> Self {
        Self { user_repo, token_gen, session_repo }
    }

    pub async fn execute(
        &self,
        email: String,
        google_id: String,
        name: String,
        picture: Option<String>,
        google_access_token: Option<String>,
        google_refresh_token: Option<String>,
        google_token_expires_at: Option<i64>,
    ) -> Result<(String, String)> {
        // 1. Try to find user by google_id
        let user = if let Some(u) = self.user_repo.find_by_google_id(&google_id).await? {
            u
        } else {
            // 2. Try to find by email
            if let Some(mut u) = self.user_repo.find_by_email(&email).await? {
                // Update existing user with google info
                u.google_id = Some(google_id);
                u.full_name = Some(name);
                if u.profile_picture.is_none() {
                    u.profile_picture = picture;
                }
                u.updated_at = Utc::now();
                self.user_repo.update(u.clone()).await?;
                u
            } else {
                // 3. Create new user
                let new_user = User {
                    id: Uuid::new_v4(),
                    email,
                    password_hash: "GOOGLE_AUTH".to_string(), // Placeholder
                    google_id: Some(google_id),
                    full_name: Some(name),
                    profile_picture: picture,
                    plan: "free".to_string(),
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                };
                self.user_repo.create(new_user.clone()).await?;
                new_user
            }
        };

        // 4. Create Session
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
            expires_at,
            google_access_token,
            google_refresh_token,
            google_token_expires_at,
        };
        self.session_repo.save(session).await?;

        Ok((token, user.id.to_string()))
    }
}
