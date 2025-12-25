use async_trait::async_trait;
use uuid::Uuid;
use anyhow::Result;

#[async_trait]
pub trait MaintenanceRepository: Send + Sync {
    async fn clear_all_data(&self, user_id: Uuid) -> Result<()>;
}
