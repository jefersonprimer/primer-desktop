use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct NotionIntegration {
    pub id: Uuid,
    pub user_id: Uuid,
    pub access_token: String,
    pub bot_id: String,
    pub workspace_id: String,
    pub workspace_name: Option<String>,
    pub workspace_icon: Option<String>,
    pub owner_type: String,
    pub duplicated_template_id: Option<String>,
    pub token_type: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
