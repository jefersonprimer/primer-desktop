use async_trait::async_trait;
use super::entity::PromptPreset;
use anyhow::Result;

#[async_trait]
pub trait PromptPresetRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<PromptPreset>>;
    async fn find_by_id(&self, id: &str) -> Result<Option<PromptPreset>>;
    async fn save(&self, preset: &PromptPreset) -> Result<PromptPreset>;
    async fn update(&self, preset: &PromptPreset) -> Result<PromptPreset>;
    async fn delete(&self, id: &str) -> Result<()>;
}
