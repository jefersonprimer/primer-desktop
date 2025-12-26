use async_trait::async_trait;
use super::entity::Changelog;

#[async_trait]
pub trait ChangelogRepository: Send + Sync {
    async fn get_all(&self) -> anyhow::Result<Vec<Changelog>>;
}
