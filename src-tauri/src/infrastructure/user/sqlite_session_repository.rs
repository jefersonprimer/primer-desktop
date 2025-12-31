use async_trait::async_trait;
use sqlx::{SqlitePool, Row};
use anyhow::{Result, anyhow};
use uuid::Uuid;
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
            INSERT OR REPLACE INTO session (id, user_id, access_token, refresh_token, expires_at, google_access_token, google_refresh_token, google_token_expires_at)
            VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#
        )
        .bind(session.user_id.to_string())
        .bind(session.access_token.clone())
        .bind(session.refresh_token.clone())
        .bind(session.expires_at)
        .bind(session.google_access_token.clone())
        .bind(session.google_refresh_token.clone())
        .bind(session.google_token_expires_at)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to save session: {}", e))?;

        Ok(session)
    }

    async fn get(&self) -> Result<Option<Session>> {
        let record = sqlx::query(
            r#"
            SELECT id, user_id, access_token, refresh_token, expires_at, google_access_token, google_refresh_token, google_token_expires_at
            FROM session
            WHERE id = 1
            "#
        )
        .try_map(|row: sqlx::sqlite::SqliteRow| {
            let user_id_str: String = row.get("user_id");
            
            Ok(Session {
                id: row.get("id"),
                user_id: Uuid::parse_str(&user_id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                access_token: row.get("access_token"),
                refresh_token: row.get("refresh_token"),
                expires_at: row.get("expires_at"),
                google_access_token: row.get("google_access_token"),
                google_refresh_token: row.get("google_refresh_token"),
                google_token_expires_at: row.get("google_token_expires_at"),
            })
        })
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
