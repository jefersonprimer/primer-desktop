use async_trait::async_trait;
use sqlx::SqlitePool;
use std::error::Error;
use crate::domain::user::{
    entity::shortcut::Shortcut,
    repository::shortcut_repository::ShortcutRepository,
};

pub struct SqliteShortcutRepository {
    pool: SqlitePool,
}

impl SqliteShortcutRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ShortcutRepository for SqliteShortcutRepository {
    async fn save(&self, shortcut: &Shortcut) -> Result<Shortcut, Box<dyn Error>> {
        sqlx::query(
            r#"
            INSERT INTO shortcuts (id, user_id, action, keys, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#
        )
        .bind(&shortcut.id)
        .bind(&shortcut.user_id)
        .bind(&shortcut.action)
        .bind(&shortcut.keys)
        .bind(&shortcut.created_at)
        .bind(&shortcut.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(shortcut.clone())
    }

    async fn update(&self, shortcut: &Shortcut) -> Result<Shortcut, Box<dyn Error>> {
        sqlx::query(
            r#"
            UPDATE shortcuts
            SET keys = ?1, updated_at = ?2
            WHERE id = ?3
            "#
        )
        .bind(&shortcut.keys)
        .bind(&shortcut.updated_at)
        .bind(&shortcut.id)
        .execute(&self.pool)
        .await?;
        
        Ok(shortcut.clone())
    }

    async fn find_by_user_id(&self, user_id: &str) -> Result<Vec<Shortcut>, Box<dyn Error>> {
        let recs = sqlx::query_as::<_, Shortcut>(
            r#"
            SELECT id, user_id, action, keys, created_at, updated_at
            FROM shortcuts
            WHERE user_id = ?1
            "#
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(recs)
    }

    async fn find_by_user_and_action(&self, user_id: &str, action: &str) -> Result<Option<Shortcut>, Box<dyn Error>> {
        let rec = sqlx::query_as::<_, Shortcut>(
            r#"
            SELECT id, user_id, action, keys, created_at, updated_at
            FROM shortcuts
            WHERE user_id = ?1 AND action = ?2
            "#
        )
        .bind(user_id)
        .bind(action)
        .fetch_optional(&self.pool)
        .await?;

        Ok(rec)
    }
}
