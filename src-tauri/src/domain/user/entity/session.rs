use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Session {
    pub id: i32,  // Always 1 (enforced by CHECK constraint)
    pub user_id: Uuid,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: i64,  // epoch timestamp
    pub google_access_token: Option<String>,
}
