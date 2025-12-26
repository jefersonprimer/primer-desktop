use async_trait::async_trait;
use crate::domain::changelog::{entity::Changelog, repository::ChangelogRepository};

pub struct NoOpChangelogRepository;

impl NoOpChangelogRepository {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ChangelogRepository for NoOpChangelogRepository {
    async fn get_all(&self) -> anyhow::Result<Vec<Changelog>> {
        Ok(vec![])
    }
}
