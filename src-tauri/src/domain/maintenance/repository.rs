use async_trait::async_trait;
use uuid::Uuid;
use anyhow::Result;
use super::entity::UserStats;

#[async_trait]
pub trait MaintenanceRepository: Send + Sync {
    async fn clear_all_data(&self, user_id: Uuid) -> Result<()>;
    async fn get_stats(&self, user_id: Uuid) -> Result<UserStats>;
}
