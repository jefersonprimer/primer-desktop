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
    async fn clear_all_data(&self, _user_id: Uuid) -> Result<()> {
        let mut tx = self.pool.begin().await.map_err(|e| anyhow!("Failed to begin transaction: {}", e))?;

        // 1. Delete all messages
        sqlx::query("DELETE FROM messages")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete messages: {}", e))?;

        // 2. Delete all chats
        sqlx::query("DELETE FROM chats")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete chats: {}", e))?;

        // 3. Delete all API keys
        sqlx::query("DELETE FROM user_api_keys")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete api keys: {}", e))?;

        // 4. Delete all users
        sqlx::query("DELETE FROM users")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete users: {}", e))?;

        // 5. Delete session (Force logout state)
        sqlx::query("DELETE FROM session")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete session: {}", e))?;

        // 6. Delete all custom prompt presets (is_built_in = 0)
        sqlx::query("DELETE FROM prompt_presets WHERE is_built_in = 0")
            .execute(&mut *tx)
            .await
            .map_err(|e| anyhow!("Failed to delete prompt presets: {}", e))?;

        tx.commit().await.map_err(|e| anyhow!("Failed to commit transaction: {}", e))?;

        Ok(())
    }
}
