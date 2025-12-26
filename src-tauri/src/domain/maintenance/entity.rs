use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserStats {
    pub sessions: i64,
    pub messages: i64,
    pub active: i64,
}
