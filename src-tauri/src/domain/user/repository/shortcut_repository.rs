use async_trait::async_trait;
use crate::domain::user::entity::shortcut::Shortcut;
use std::error::Error;

#[async_trait]
pub trait ShortcutRepository: Send + Sync {
    async fn save(&self, shortcut: &Shortcut) -> Result<Shortcut, Box<dyn Error>>;
    async fn find_by_user_id(&self, user_id: &str) -> Result<Vec<Shortcut>, Box<dyn Error>>;
    async fn find_by_user_and_action(&self, user_id: &str, action: &str) -> Result<Option<Shortcut>, Box<dyn Error>>;
    async fn update(&self, shortcut: &Shortcut) -> Result<Shortcut, Box<dyn Error>>;
}
