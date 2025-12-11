use async_trait::async_trait;
use sqlx::{SqlitePool, Row};
use crate::domain::config::{entity::AppConfig, repository::ConfigRepository};
use anyhow::Result;

pub struct SqliteConfigRepository {
    pool: SqlitePool,
}

impl SqliteConfigRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ConfigRepository for SqliteConfigRepository {
    async fn get(&self) -> Result<AppConfig> {
        let rec = sqlx::query("SELECT language FROM app_config WHERE id = 1")
            .fetch_optional(&self.pool)
            .await?;

        match rec {
            Some(row) => Ok(AppConfig {
                language: row.try_get("language")?,
            }),
            None => Ok(AppConfig::default()),
        }
    }

    async fn set_language(&self, language: &str) -> Result<()> {
        sqlx::query("UPDATE app_config SET language = ? WHERE id = 1")
            .bind(language)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
