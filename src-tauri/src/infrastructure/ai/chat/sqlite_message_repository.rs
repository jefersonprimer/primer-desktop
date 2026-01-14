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
        // Serialize follow_ups to JSON string
        let follow_ups_json = message.follow_ups.as_ref()
            .map(|f| serde_json::to_string(f).unwrap_or_default());

        sqlx::query(
            r#"
            INSERT INTO messages (id, chat_id, role, content, created_at, summary, message_type, importance, follow_ups)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#
        )
        .bind(message.id.to_string())
        .bind(message.chat_id.to_string())
        .bind(message.role.clone())
        .bind(message.content.clone())
        .bind(message.created_at)
        .bind(message.summary.clone())
        .bind(message.message_type.clone())
        .bind(message.importance)
        .bind(follow_ups_json)
        .execute(&self.pool)
        .await?;

        Ok(message)
    }

    async fn find_by_chat_id(&self, chat_id: Uuid) -> Result<Vec<Message>> {
        let records = sqlx::query(
            r#"
            SELECT id, chat_id, role, content, created_at, summary, message_type, importance, follow_ups
            FROM messages
            WHERE chat_id = ?1
            ORDER BY created_at ASC
            "#
        )
        .bind(chat_id.to_string())
        .try_map(|row: sqlx::sqlite::SqliteRow| {
            let id_str: String = row.get("id");
            let chat_id_str: String = row.get("chat_id");
            let follow_ups_json: Option<String> = row.get("follow_ups");
            
            // Deserialize follow_ups from JSON
            let follow_ups = follow_ups_json.and_then(|json| {
                serde_json::from_str::<Vec<String>>(&json).ok()
            });

            Ok(Message {
                id: Uuid::parse_str(&id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                chat_id: Uuid::parse_str(&chat_id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                role: row.get("role"),
                content: row.get("content"),
                created_at: row.get("created_at"),
                summary: row.get("summary"),
                message_type: row.get("message_type"),
                importance: row.get("importance"),
                follow_ups,
                tip: None, // Tips are not persisted, recalculated per-request
            })
        })
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }

    async fn update(&self, message: Message) -> Result<Message> {
        sqlx::query(
            r#"
            UPDATE messages 
            SET summary = ?1, message_type = ?2, importance = ?3
            WHERE id = ?4
            "#
        )
        .bind(message.summary.clone())
        .bind(message.message_type.clone())
        .bind(message.importance)
        .bind(message.id.to_string())
        .execute(&self.pool)
        .await?;

        Ok(message)
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

    async fn find_high_importance_summaries(&self, user_id: Uuid, limit_chats: i32, top_k: i32) -> Result<Vec<Message>> {
        // This query finds the top K most important summaries from the user's recent chats
        let records = sqlx::query(
            r#"
            SELECT m.id, m.chat_id, m.role, m.content, m.created_at, m.summary, m.message_type, m.importance, m.follow_ups
            FROM messages m
            JOIN chats c ON m.chat_id = c.id
            WHERE c.user_id = ?1
              AND m.summary IS NOT NULL
              AND m.importance > 0
              AND m.chat_id IN (
                  SELECT id FROM chats WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?2
              )
            ORDER BY m.importance DESC, m.created_at DESC
            LIMIT ?3
            "#
        )
        .bind(user_id.to_string())
        .bind(limit_chats)
        .bind(top_k)
        .try_map(|row: sqlx::sqlite::SqliteRow| {
            let id_str: String = row.get("id");
            let chat_id_str: String = row.get("chat_id");
            let follow_ups_json: Option<String> = row.get("follow_ups");
            
            let follow_ups = follow_ups_json.and_then(|json| {
                serde_json::from_str::<Vec<String>>(&json).ok()
            });

            Ok(Message {
                id: Uuid::parse_str(&id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                chat_id: Uuid::parse_str(&chat_id_str).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
                role: row.get("role"),
                content: row.get("content"),
                created_at: row.get("created_at"),
                summary: row.get("summary"),
                message_type: row.get("message_type"),
                importance: row.get("importance"),
                follow_ups,
                tip: None, // Tips are not persisted
            })
        })
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }
}

