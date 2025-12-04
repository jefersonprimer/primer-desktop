use uuid::Uuid;
use anyhow::Result;
use async_trait::async_trait; // Added
use crate::domain::user::entity::user_api_key::UserApiKey;

#[async_trait] // Added
pub trait UserApiKeyRepository: Send + Sync {
    async fn create(&self, api_key: UserApiKey) -> Result<UserApiKey>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserApiKey>>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}
