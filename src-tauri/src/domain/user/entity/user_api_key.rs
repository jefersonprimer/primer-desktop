use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub provider: String,
    pub api_key: String,
    pub created_at: DateTime<Utc>,
}
