use std::sync::Arc;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use log;
use crate::infrastructure::notion::client::NotionClient;
use crate::domain::notion::repository::NotionRepository;

pub struct CreatePageUseCase {
    notion_repo: Arc<dyn NotionRepository>,
    notion_client: Arc<NotionClient>,
}

impl CreatePageUseCase {
    pub fn new(
        notion_repo: Arc<dyn NotionRepository>,
        notion_client: Arc<NotionClient>,
    ) -> Self {
        Self {
            notion_repo,
            notion_client,
        }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        title: String,
        content: String,
        parent_id: Option<String>,
    ) -> Result<String> {
        let integration = self.notion_repo.find_by_user_id(user_id).await?
            .ok_or_else(|| anyhow!("Notion not connected"))?;

        let mut target_parent_id = parent_id
            .or(integration.duplicated_template_id.clone());

        // Fallback: If still no parent_id, search for available pages
        if target_parent_id.is_none() {
            log::info!("No parent_id found, searching for available Notion pages to use as default...");
            let pages = self.notion_client.search(&integration.access_token, None).await?;
            if let Some(first_page) = pages.first() {
                log::info!("Using page '{}' (ID: {}) as default parent", first_page.id, first_page.id);
                target_parent_id = Some(first_page.id.clone());
            }
        }

        let final_parent_id = target_parent_id
            .ok_or_else(|| anyhow!("No parent page found. Please ensure you have shared at least one page with the integration in Notion settings."))?;

        // Ensure we have a valid access token
        let page_id = self.notion_client.create_page(
            &integration.access_token,
            &final_parent_id,
            &title,
            &content
        ).await?;

        Ok(page_id)
    }
}
