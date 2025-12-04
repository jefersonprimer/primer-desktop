use async_trait::async_trait;
use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use crate::domain::ai::chat::entity::chat::Chat;
use crate::domain::ai::chat::repository::chat_repository::ChatRepository;

pub struct PostgresChatRepository {
    pool: PgPool,
}

impl PostgresChatRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ChatRepository for PostgresChatRepository {
    async fn create(&self, chat: Chat) -> Result<Chat> {
        sqlx::query(
            r#"
            INSERT INTO chats (id, user_id, title, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            "#
        )
        .bind(chat.id)
        .bind(chat.user_id)
        .bind(chat.title.clone())
        .bind(chat.created_at)
        .bind(chat.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(chat)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Chat>> {
        let record = sqlx::query_as::<_, Chat>(
            r#"
            SELECT id, user_id, title, created_at, updated_at
            FROM chats
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(record)
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<Chat>> {
        let records = sqlx::query_as::<_, Chat>(
            r#"
            SELECT id, user_id, title, created_at, updated_at
            FROM chats
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }

    async fn update(&self, chat: Chat) -> Result<Chat> {
        sqlx::query(
            r#"
            UPDATE chats
            SET title = $1, updated_at = $2
            WHERE id = $3 AND user_id = $4
            "#
        )
        .bind(chat.title.clone())
        .bind(chat.updated_at)
        .bind(chat.id)
        .bind(chat.user_id)
        .execute(&self.pool)
        .await?;

        Ok(chat)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM chats
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
