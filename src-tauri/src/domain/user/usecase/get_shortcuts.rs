use std::sync::Arc;
use crate::domain::user::{
    dto::{GetShortcutsDto, GetShortcutsResponse, ShortcutDto},
    repository::shortcut_repository::ShortcutRepository,
};

pub struct GetShortcutsUseCase {
    repository: Arc<dyn ShortcutRepository>,
}

impl GetShortcutsUseCase {
    pub fn new(repository: Arc<dyn ShortcutRepository>) -> Self {
        Self { repository }
    }

    pub async fn execute(&self, dto: GetShortcutsDto) -> Result<GetShortcutsResponse, String> {
        let shortcuts = self.repository.find_by_user_id(&dto.user_id)
            .await
            .map_err(|e| e.to_string())?;

        let shortcut_dtos = shortcuts.into_iter().map(|s| ShortcutDto {
            id: s.id,
            user_id: s.user_id,
            action: s.action,
            keys: s.keys,
            created_at: s.created_at,
            updated_at: s.updated_at,
        }).collect();

        Ok(GetShortcutsResponse {
            shortcuts: shortcut_dtos,
        })
    }
}
