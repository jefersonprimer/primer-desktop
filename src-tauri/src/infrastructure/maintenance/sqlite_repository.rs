use async_trait::async_trait;
use sqlx::SqlitePool;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::maintenance::repository::MaintenanceRepository;

pub struct SqliteMaintenanceRepository {
    pool: SqlitePool,
}

impl SqliteMaintenanceRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl MaintenanceRepository for SqliteMaintenanceRepository {
    async fn clear_all_data(&self, user_id: Uuid) -> Result<()> {
        let mut tx = self.pool.begin().await.map_err(|e| anyhow!("Failed to begin transaction: {}", e))?;

        // 1. Delete all chats (cascades to messages)
        // Note: chats table user_id is NOT a foreign key to users table in local sqlite, so we delete by column.
        sqlx::query("DELETE FROM chats WHERE user_id = ?1")
            .bind(user_id.to_string())
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete chats: {}", e))?;

        // 2. Delete all API keys
        sqlx::query("DELETE FROM user_api_keys WHERE user_id = ?1")
            .bind(user_id.to_string())
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete api keys: {}", e))?;

        // 3. Delete all custom prompt presets (is_built_in = 0)
        // These are global (no user_id column), so they are deleted for the app installation context.
        sqlx::query("DELETE FROM prompt_presets WHERE is_built_in = 0")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete prompt presets: {}", e))?;

        tx.commit().await.map_err(|e| anyhow!("Failed to commit transaction: {}", e))?;

        Ok(())
    }
}
