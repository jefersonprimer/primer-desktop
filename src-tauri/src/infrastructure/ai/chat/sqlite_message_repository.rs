use async_trait::async_trait;
use sqlx::SqlitePool;
use anyhow::Result;
use sqlx::Row;
use uuid::Uuid;
use crate::domain::ai::chat::entity::message::Message;
use crate::domain::ai::chat::repository::message_repository::MessageRepository;

pub struct SqliteMessageRepository {
    pool: SqlitePool,
}

impl SqliteMessageRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl MessageRepository for SqliteMessageRepository {
    async fn create(&self, message: Message) -> Result<Message> {
        sqlx::query(
            r#"
            INSERT INTO messages (id, chat_id, role, content, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#
        )
        .bind(message.id.to_string())
        .bind(message.chat_id.to_string())
        .bind(message.role.clone())
        .bind(message.content.clone())
        .bind(message.created_at)
        .execute(&self.pool)
        .await?;

        Ok(message)
    }

    async fn find_by_chat_id(&self, chat_id: Uuid) -> Result<Vec<Message>> {
        let records = sqlx::query(
            r#"
            SELECT id, chat_id, role, content, created_at
            FROM messages
            WHERE chat_id = ?1
            ORDER BY created_at ASC
            "#
        )
        .bind(chat_id.to_string())
        .try_map(|row: sqlx::sqlite::SqliteRow| {
            let id_str: String = row.get("id");
            let chat_id_str: String = row.get("chat_id");
            
            Ok(Message {
                id: Uuid::parse_str(&id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                chat_id: Uuid::parse_str(&chat_id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                role: row.get("role"),
                content: row.get("content"),
                created_at: row.get("created_at"),
            })
        })
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM messages
            WHERE id = ?1
            "#
        )
        .bind(id.to_string())
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

