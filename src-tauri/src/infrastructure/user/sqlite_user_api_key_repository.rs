use async_trait::async_trait;
use sqlx::{SqlitePool, Row};
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
        let rows = sqlx::query(
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

        let mut recs = Vec::new();
        for row in rows {
            let id_str: String = row.try_get("id").map_err(|e| anyhow!("Failed to get id: {}", e))?;
            let user_id_str: String = row.try_get("user_id").map_err(|e| anyhow!("Failed to get user_id: {}", e))?;
            
            recs.push(UserApiKey {
                id: Uuid::parse_str(&id_str).map_err(|e| anyhow!("Failed to parse id: {}", e))?,
                user_id: Uuid::parse_str(&user_id_str).map_err(|e| anyhow!("Failed to parse user_id: {}", e))?,
                provider: row.try_get("provider").map_err(|e| anyhow!("Failed to get provider: {}", e))?,
                api_key: row.try_get("api_key").map_err(|e| anyhow!("Failed to get api_key: {}", e))?,
                selected_model: row.try_get("selected_model").map_err(|e| anyhow!("Failed to get selected_model: {}", e))?,
                created_at: row.try_get("created_at").map_err(|e| anyhow!("Failed to get created_at: {}", e))?,
            });
        }

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

    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM user_api_keys
            WHERE user_id = ?1
            "#
        )
        .bind(user_id.to_string())
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete all api keys: {}", e))?;

        Ok(())
    }
}
