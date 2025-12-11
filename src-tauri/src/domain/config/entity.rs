use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub language: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            language: "en-US".to_string(),
        }
    }
}
