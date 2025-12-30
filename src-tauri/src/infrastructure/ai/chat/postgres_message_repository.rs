use async_trait::async_trait;
use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use crate::domain::ai::chat::entity::message::Message;
use crate::domain::ai::chat::repository::message_repository::MessageRepository;

pub struct PostgresMessageRepository {
    pool: PgPool,
}

impl PostgresMessageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl MessageRepository for PostgresMessageRepository {
    async fn create(&self, message: Message) -> Result<Message> {
        sqlx::query(
            r#"
            INSERT INTO messages (id, chat_id, role, content, created_at, summary, message_type, importance)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#
        )
        .bind(message.id)
        .bind(message.chat_id)
        .bind(message.role.clone())
        .bind(message.content.clone())
        .bind(message.created_at)
        .bind(message.summary.clone())
        .bind(message.message_type.clone())
        .bind(message.importance)
        .execute(&self.pool)
        .await?;

        Ok(message)
    }

    async fn find_by_chat_id(&self, chat_id: Uuid) -> Result<Vec<Message>> {
        let records = sqlx::query_as::<_, Message>(
            r#"
            SELECT id, chat_id, role, content, created_at, summary, message_type, importance
            FROM messages
            WHERE chat_id = $1
            ORDER BY created_at ASC
            "#
        )
        .bind(chat_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }

    async fn update(&self, message: Message) -> Result<Message> {
        sqlx::query(
            r#"
            UPDATE messages 
            SET summary = $1, message_type = $2, importance = $3
            WHERE id = $4
            "#
        )
        .bind(message.summary.clone())
        .bind(message.message_type.clone())
        .bind(message.importance)
        .bind(message.id)
        .execute(&self.pool)
        .await?;

        Ok(message)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM messages
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn find_high_importance_summaries(&self, user_id: Uuid, limit_chats: i32, top_k: i32) -> Result<Vec<Message>> {
        let records = sqlx::query_as::<_, Message>(
            r#"
            SELECT m.id, m.chat_id, m.role, m.content, m.created_at, m.summary, m.message_type, m.importance
            FROM messages m
            JOIN chats c ON m.chat_id = c.id
            WHERE c.user_id = $1
              AND m.summary IS NOT NULL
              AND m.importance > 0
              AND m.chat_id IN (
                  SELECT id FROM chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
              )
            ORDER BY m.importance DESC, m.created_at DESC
            LIMIT $3
            "#
        )
        .bind(user_id)
        .bind(limit_chats)
        .bind(top_k)
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }
}

