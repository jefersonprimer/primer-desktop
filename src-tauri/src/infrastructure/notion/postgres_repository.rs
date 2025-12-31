use async_trait::async_trait;
use sqlx::{Postgres, Pool, Row};
use anyhow::{Result, anyhow};
use uuid::Uuid;
use crate::domain::notion::{
    entity::NotionIntegration,
    repository::NotionRepository,
};

pub struct PostgresNotionRepository {
    pool: Pool<Postgres>,
}

impl PostgresNotionRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl NotionRepository for PostgresNotionRepository {
    async fn save(&self, integration: NotionIntegration) -> Result<NotionIntegration> {
        sqlx::query(
            r#"
            INSERT INTO notion_integrations (
                id, user_id, access_token, bot_id, workspace_id, workspace_name, workspace_icon,
                owner_type, duplicated_template_id, token_type, expires_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (user_id) DO UPDATE SET
                access_token = EXCLUDED.access_token,
                bot_id = EXCLUDED.bot_id,
                workspace_id = EXCLUDED.workspace_id,
                workspace_name = EXCLUDED.workspace_name,
                workspace_icon = EXCLUDED.workspace_icon,
                owner_type = EXCLUDED.owner_type,
                duplicated_template_id = EXCLUDED.duplicated_template_id,
                expires_at = EXCLUDED.expires_at,
                updated_at = EXCLUDED.updated_at
            RETURNING *
            "#
        )
        .bind(integration.id)
        .bind(integration.user_id)
        .bind(integration.access_token)
        .bind(integration.bot_id)
        .bind(integration.workspace_id)
        .bind(integration.workspace_name)
        .bind(integration.workspace_icon)
        .bind(integration.owner_type)
        .bind(integration.duplicated_template_id)
        .bind(integration.token_type)
        .bind(integration.expires_at)
        .bind(integration.created_at)
        .bind(integration.updated_at)
        .map(|row: sqlx::postgres::PgRow| {
             NotionIntegration {
                id: row.get("id"),
                user_id: row.get("user_id"),
                access_token: row.get("access_token"),
                bot_id: row.get("bot_id"),
                workspace_id: row.get("workspace_id"),
                workspace_name: row.get("workspace_name"),
                workspace_icon: row.get("workspace_icon"),
                owner_type: row.get("owner_type"),
                duplicated_template_id: row.get("duplicated_template_id"),
                token_type: row.get("token_type"),
                expires_at: row.get("expires_at"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        })
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to save notion integration: {}", e))
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Option<NotionIntegration>> {
        let integration = sqlx::query_as::<_, NotionIntegration>(
            r#"
            SELECT * FROM notion_integrations
            WHERE user_id = $1
            "#
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to fetch notion integration: {}", e))?;

        Ok(integration)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM notion_integrations
            WHERE user_id = $1
            "#
        )
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete notion integration: {}", e))?;

        Ok(())
    }
}
