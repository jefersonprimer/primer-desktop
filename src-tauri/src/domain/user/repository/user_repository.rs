use uuid::Uuid;
use anyhow::Result;
use async_trait::async_trait; // Added
use crate::domain::user::entity::user::User;

#[async_trait] // Added
pub trait UserRepository: Send + Sync {
    async fn create(&self, user: User) -> Result<User>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>>;
    async fn find_by_google_id(&self, google_id: &str) -> Result<Option<User>>;
    async fn update(&self, user: User) -> Result<User>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}
