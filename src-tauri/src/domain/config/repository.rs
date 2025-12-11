use async_trait::async_trait;
use crate::domain::config::entity::AppConfig;
use anyhow::Result;

#[async_trait]
pub trait ConfigRepository: Send + Sync {
    async fn get(&self) -> Result<AppConfig>;
    async fn set_language(&self, language: &str) -> Result<()>;
}
