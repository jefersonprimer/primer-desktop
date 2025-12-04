use async_trait::async_trait;
use sqlx::{SqlitePool};
use anyhow::{Result, anyhow};
use crate::domain::user::{
    entity::session::Session,
    repository::session_repository::SessionRepository,
};

pub struct SqliteSessionRepository {
    pool: SqlitePool,
}

impl SqliteSessionRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl SessionRepository for SqliteSessionRepository {
    async fn save(&self, session: Session) -> Result<Session> {
        // SQLite uses positional parameters (?1, ?2, ...) rather than $1-style.
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO session (id, user_id, access_token, refresh_token, expires_at)
            VALUES (1, ?1, ?2, ?3, ?4)
            "#
        )
        .bind(session.user_id.to_string())
        .bind(session.access_token.clone())
        .bind(session.refresh_token.clone())
        .bind(session.expires_at)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to save session: {}", e))?;

        Ok(session)
    }

    async fn get(&self) -> Result<Option<Session>> {
        let record = sqlx::query_as::<_, Session>(
            r#"
            SELECT id, user_id, access_token, refresh_token, expires_at
            FROM session
            WHERE id = 1
            "#
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to get session: {}", e))?;

        Ok(record)
    }

    async fn clear(&self) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM session
            WHERE id = 1
            "#
        )
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to clear session: {}", e))?;

        Ok(())
    }
}
