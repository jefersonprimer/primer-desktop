use uuid::Uuid;
use anyhow::Result;
use async_trait::async_trait;
use crate::domain::ai::chat::entity::message::Message;

#[async_trait]
pub trait MessageRepository: Send + Sync {
    async fn create(&self, message: Message) -> Result<Message>;
    async fn find_by_chat_id(&self, chat_id: Uuid) -> Result<Vec<Message>>;
    async fn update(&self, message: Message) -> Result<Message>;
    async fn delete(&self, id: Uuid) -> Result<()>;
    
    // New method for RAG
    async fn find_high_importance_summaries(&self, user_id: Uuid, limit_chats: i32, top_k: i32) -> Result<Vec<Message>>; 
}
