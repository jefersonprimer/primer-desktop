use uuid::Uuid;
use anyhow::Result;
use async_trait::async_trait; // Added
use crate::domain::ai::chat::entity::message::Message;

#[async_trait] // Added
pub trait MessageRepository: Send + Sync {
    async fn create(&self, message: Message) -> Result<Message>;
    async fn find_by_chat_id(&self, chat_id: Uuid) -> Result<Vec<Message>>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}
