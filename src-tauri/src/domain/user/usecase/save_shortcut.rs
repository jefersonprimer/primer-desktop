use std::sync::Arc;
use crate::domain::user::{
    dto::{SaveShortcutDto, SaveShortcutResponse, ShortcutDto},
    entity::shortcut::Shortcut,
    repository::shortcut_repository::ShortcutRepository,
};
use uuid::Uuid;

pub struct SaveShortcutUseCase {
    repository: Arc<dyn ShortcutRepository>,
}

impl SaveShortcutUseCase {
    pub fn new(repository: Arc<dyn ShortcutRepository>) -> Self {
        Self { repository }
    }

    pub async fn execute(&self, dto: SaveShortcutDto) -> Result<SaveShortcutResponse, String> {
        // Check if shortcut already exists for this action
        let existing = self.repository.find_by_user_and_action(&dto.user_id, &dto.action)
            .await
            .map_err(|e| e.to_string())?;

        let saved_shortcut = if let Some(mut shortcut) = existing {
            shortcut.keys = dto.keys;
            shortcut.updated_at = chrono::Utc::now().to_rfc3339();
            self.repository.update(&shortcut)
                .await
                .map_err(|e| e.to_string())?
        } else {
            let new_shortcut = Shortcut::new(
                Uuid::new_v4().to_string(),
                dto.user_id,
                dto.action,
                dto.keys,
            );
            self.repository.save(&new_shortcut)
                .await
                .map_err(|e| e.to_string())?
        };

        Ok(SaveShortcutResponse {
            shortcut: ShortcutDto {
                id: saved_shortcut.id,
                user_id: saved_shortcut.user_id,
                action: saved_shortcut.action,
                keys: saved_shortcut.keys,
                created_at: saved_shortcut.created_at,
                updated_at: saved_shortcut.updated_at,
            },
        })
    }
}
