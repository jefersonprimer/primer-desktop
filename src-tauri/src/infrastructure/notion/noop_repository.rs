use async_trait::async_trait;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::notion::{
    entity::NotionIntegration,
    repository::NotionRepository,
};

pub struct NoOpNotionRepository;

impl NoOpNotionRepository {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl NotionRepository for NoOpNotionRepository {
    async fn save(&self, _integration: NotionIntegration) -> Result<NotionIntegration> {
        Err(anyhow!("Notion integration not supported in this mode"))
    }

    async fn find_by_user_id(&self, _user_id: Uuid) -> Result<Option<NotionIntegration>> {
        Ok(None)
    }

    async fn delete_by_user_id(&self, _user_id: Uuid) -> Result<()> {
        Ok(())
    }
}
