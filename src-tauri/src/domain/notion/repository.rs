use async_trait::async_trait;
use uuid::Uuid;
use anyhow::Result;
use super::entity::NotionIntegration;

#[async_trait]
pub trait NotionRepository: Send + Sync {
    async fn save(&self, integration: NotionIntegration) -> Result<NotionIntegration>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Option<NotionIntegration>>;
    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}
