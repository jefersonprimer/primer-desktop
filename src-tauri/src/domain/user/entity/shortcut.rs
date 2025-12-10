use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Shortcut {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub keys: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Shortcut {
    pub fn new(id: String, user_id: String, action: String, keys: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id,
            user_id,
            action,
            keys,
            created_at: now.clone(),
            updated_at: now,
        }
    }
}
