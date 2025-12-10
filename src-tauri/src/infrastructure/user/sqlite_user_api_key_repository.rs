use async_trait::async_trait;
use sqlx::SqlitePool;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    entity::user_api_key::UserApiKey,
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct SqliteUserApiKeyRepository {
    pool: SqlitePool,
}

impl SqliteUserApiKeyRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserApiKeyRepository for SqliteUserApiKeyRepository {
    async fn create(&self, api_key: UserApiKey) -> Result<UserApiKey> {
        // SQLite backend uses TEXT columns, so we store UUIDs as strings.
        sqlx::query(
            r#"
            INSERT INTO user_api_keys (id, user_id, provider, api_key, selected_model, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#
        )
        .bind(api_key.id.to_string())
        .bind(api_key.user_id.to_string())
        .bind(api_key.provider.clone())
        .bind(api_key.api_key.clone())
        .bind(api_key.selected_model.clone())
        .bind(api_key.created_at)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to create api key: {}", e))?;

        Ok(api_key)
    }

    async fn update(&self, api_key: UserApiKey) -> Result<UserApiKey> {
        sqlx::query(
            r#"
            UPDATE user_api_keys
            SET api_key = ?1, selected_model = ?2
            WHERE id = ?3
            "#
        )
        .bind(api_key.api_key.clone())
        .bind(api_key.selected_model.clone())
        .bind(api_key.id.to_string())
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to update api key: {}", e))?;

        Ok(api_key)
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserApiKey>> {
        let recs = sqlx::query_as::<_, UserApiKey>(
            r#"
            SELECT id, user_id, provider, api_key, selected_model, created_at
            FROM user_api_keys
            WHERE user_id = ?1
            "#
        )
        .bind(user_id.to_string())
        .fetch_all(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to find api keys: {}", e))?;

        Ok(recs)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM user_api_keys
            WHERE id = ?1
            "#
        )
        .bind(id.to_string())
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete api key: {}", e))?;

        Ok(())
    }
}
