use uuid::Uuid;
use anyhow::Result;
use async_trait::async_trait;
use crate::domain::ai::chat::entity::chat::Chat;

#[async_trait]
pub trait ChatRepository: Send + Sync {
    async fn create(&self, chat: Chat) -> Result<Chat>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Chat>>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<Chat>>;
    async fn update(&self, chat: Chat) -> Result<Chat>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}
