use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub chat_id: Uuid,
    pub role: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub summary: Option<String>,
    pub message_type: String,
    pub importance: i32,
    #[sqlx(skip)]
    pub follow_ups: Option<Vec<String>>,
}

