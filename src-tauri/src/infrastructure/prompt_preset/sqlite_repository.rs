use async_trait::async_trait;
use sqlx::SqlitePool;
use anyhow::{Result, anyhow};
use crate::domain::prompt_preset::{
    entity::PromptPreset,
    repository::PromptPresetRepository,
};

pub struct SqlitePromptPresetRepository {
    pool: SqlitePool,
}

impl SqlitePromptPresetRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PromptPresetRepository for SqlitePromptPresetRepository {
    async fn find_all(&self) -> Result<Vec<PromptPreset>> {
        let recs = sqlx::query_as::<_, PromptPreset>(
            r#"
            SELECT id, name, description, prompt, is_built_in, created_at, updated_at
            FROM prompt_presets
            ORDER BY created_at ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to fetch prompt presets: {}", e))?;

        Ok(recs)
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<PromptPreset>> {
        let rec = sqlx::query_as::<_, PromptPreset>(
            r#"
            SELECT id, name, description, prompt, is_built_in, created_at, updated_at
            FROM prompt_presets
            WHERE id = ?1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to find prompt preset by id: {}", e))?;

        Ok(rec)
    }

    async fn save(&self, preset: &PromptPreset) -> Result<PromptPreset> {
        sqlx::query(
            r#"
            INSERT INTO prompt_presets (id, name, description, prompt, is_built_in, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#
        )
        .bind(preset.id.clone())
        .bind(preset.name.clone())
        .bind(preset.description.clone())
        .bind(preset.prompt.clone())
        .bind(preset.is_built_in)
        .bind(preset.created_at)
        .bind(preset.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to save prompt preset: {}", e))?;

        Ok(preset.clone())
    }

    async fn update(&self, preset: &PromptPreset) -> Result<PromptPreset> {
        sqlx::query(
            r#"
            UPDATE prompt_presets
            SET name = ?2, description = ?3, prompt = ?4, updated_at = ?5
            WHERE id = ?1
            "#
        )
        .bind(preset.id.clone())
        .bind(preset.name.clone())
        .bind(preset.description.clone())
        .bind(preset.prompt.clone())
        .bind(preset.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to update prompt preset: {}", e))?;

        Ok(preset.clone())
    }

    async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM prompt_presets
            WHERE id = ?1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete prompt preset: {}", e))?;

        Ok(())
    }
}
