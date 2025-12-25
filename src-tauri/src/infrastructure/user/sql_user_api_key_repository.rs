use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::user::{
    entity::user_api_key::UserApiKey,
    repository::user_api_key_repository::UserApiKeyRepository,
};

pub struct SqlUserApiKeyRepository {
    pool: PgPool,
}

impl SqlUserApiKeyRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserApiKeyRepository for SqlUserApiKeyRepository {
    async fn create(&self, api_key: UserApiKey) -> Result<UserApiKey> {
        sqlx::query_as::<_, UserApiKey>(
            r#"
            INSERT INTO user_api_keys (id, user_id, provider, api_key, selected_model, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, user_id, provider, api_key, selected_model, created_at
            "#
        )
        .bind(api_key.id)
        .bind(api_key.user_id)
        .bind(api_key.provider.clone())
        .bind(api_key.api_key.clone())
        .bind(api_key.selected_model.clone())
        .bind(api_key.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to create api key: {}", e))
    }

    async fn update(&self, api_key: UserApiKey) -> Result<UserApiKey> {
        sqlx::query_as::<_, UserApiKey>(
            r#"
            UPDATE user_api_keys
            SET api_key = $1, selected_model = $2
            WHERE id = $3
            RETURNING id, user_id, provider, api_key, selected_model, created_at
            "#
        )
        .bind(api_key.api_key.clone())
        .bind(api_key.selected_model.clone())
        .bind(api_key.id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to update api key: {}", e))
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserApiKey>> {
        let recs = sqlx::query_as::<_, UserApiKey>(
            r#"
            SELECT id, user_id, provider, api_key, selected_model, created_at
            FROM user_api_keys
            WHERE user_id = $1
            "#
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to find api keys: {}", e))?;

        Ok(recs)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM user_api_keys
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete api key: {}", e))?;

        Ok(())
    }

    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM user_api_keys
            WHERE user_id = $1
            "#
        )
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete all api keys: {}", e))?;

        Ok(())
    }
}

