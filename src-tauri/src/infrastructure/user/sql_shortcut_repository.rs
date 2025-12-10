use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use std::error::Error;
use crate::domain::user::{
    entity::shortcut::Shortcut,
    repository::shortcut_repository::ShortcutRepository,
};

pub struct SqlShortcutRepository {
    pool: PgPool,
}

impl SqlShortcutRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ShortcutRepository for SqlShortcutRepository {
    async fn save(&self, shortcut: &Shortcut) -> Result<Shortcut, Box<dyn Error>> {
        let user_uuid = Uuid::parse_str(&shortcut.user_id)?;
        let shortcut_uuid = Uuid::parse_str(&shortcut.id)?;
        
        let created_at = chrono::DateTime::parse_from_rfc3339(&shortcut.created_at)?.with_timezone(&chrono::Utc);
        let updated_at = chrono::DateTime::parse_from_rfc3339(&shortcut.updated_at)?.with_timezone(&chrono::Utc);

        sqlx::query(
            r#"
            INSERT INTO shortcuts (id, user_id, action, keys, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#
        )
        .bind(shortcut_uuid)
        .bind(user_uuid)
        .bind(&shortcut.action)
        .bind(&shortcut.keys)
        .bind(created_at)
        .bind(updated_at)
        .execute(&self.pool)
        .await?;

        Ok(shortcut.clone())
    }

    async fn update(&self, shortcut: &Shortcut) -> Result<Shortcut, Box<dyn Error>> {
        let shortcut_uuid = Uuid::parse_str(&shortcut.id)?;
        let updated_at = chrono::DateTime::parse_from_rfc3339(&shortcut.updated_at)?.with_timezone(&chrono::Utc);

        sqlx::query(
            r#"
            UPDATE shortcuts
            SET keys = $1, updated_at = $2
            WHERE id = $3
            "#
        )
        .bind(&shortcut.keys)
        .bind(updated_at)
        .bind(shortcut_uuid)
        .execute(&self.pool)
        .await?;
        
        Ok(shortcut.clone())
    }

    async fn find_by_user_id(&self, user_id: &str) -> Result<Vec<Shortcut>, Box<dyn Error>> {
        let user_uuid = Uuid::parse_str(user_id)?;

        let recs = sqlx::query!(
            r#"
            SELECT id, user_id, action, keys, created_at, updated_at
            FROM shortcuts
            WHERE user_id = $1
            "#,
            user_uuid
        )
        .fetch_all(&self.pool)
        .await?;

        let shortcuts = recs.into_iter().map(|r| Shortcut {
            id: r.id.to_string(),
            user_id: r.user_id.to_string(),
            action: r.action,
            keys: r.keys,
            created_at: r.created_at.expect("Database date should be valid").to_rfc3339(),
            updated_at: r.updated_at.expect("Database date should be valid").to_rfc3339(),
        }).collect();

        Ok(shortcuts)
    }

    async fn find_by_user_and_action(&self, user_id: &str, action: &str) -> Result<Option<Shortcut>, Box<dyn Error>> {
        let user_uuid = Uuid::parse_str(user_id)?;

        let rec = sqlx::query!(
            r#"
            SELECT id, user_id, action, keys, created_at, updated_at
            FROM shortcuts
            WHERE user_id = $1 AND action = $2
            "#,
            user_uuid,
            action
        )
        .fetch_optional(&self.pool)
        .await?;

        match rec {
            Some(r) => Ok(Some(Shortcut {
                id: r.id.to_string(),
                user_id: r.user_id.to_string(),
                action: r.action,
                keys: r.keys,
                created_at: r.created_at.expect("Database date should be valid").to_rfc3339(),
                updated_at: r.updated_at.expect("Database date should be valid").to_rfc3339(),
            })),
            None => Ok(None),
        }
    }
}
