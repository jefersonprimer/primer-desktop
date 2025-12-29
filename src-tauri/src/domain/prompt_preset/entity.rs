use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PromptPreset {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub prompt: String,
    pub is_built_in: bool,
    #[serde(default = "default_preset_type")]
    #[sqlx(default)]
    pub preset_type: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn default_preset_type() -> Option<String> {
    Some("assistant".to_string())
}
