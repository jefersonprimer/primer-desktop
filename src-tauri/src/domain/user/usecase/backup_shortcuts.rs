use std::sync::Arc;
use anyhow::Result;
use log::info;
use crate::domain::user::{
    dto::{BackupShortcutsDto, BackupShortcutsResponse},
    repository::shortcut_repository::ShortcutRepository,
};

pub struct BackupShortcutsUseCase {
    sqlite_shortcut_repo: Arc<dyn ShortcutRepository>,
    postgres_shortcut_repo: Arc<dyn ShortcutRepository>,
}

impl BackupShortcutsUseCase {
    pub fn new(
        sqlite_shortcut_repo: Arc<dyn ShortcutRepository>,
        postgres_shortcut_repo: Arc<dyn ShortcutRepository>,
    ) -> Self {
        Self {
            sqlite_shortcut_repo,
            postgres_shortcut_repo,
        }
    }

    pub async fn execute(&self, dto: BackupShortcutsDto) -> Result<BackupShortcutsResponse> {
        let user_id_str = dto.user_id.clone();
        
        // 1. Fetch all shortcuts from local SQLite
        let local_shortcuts = self.sqlite_shortcut_repo.find_by_user_id(&user_id_str).await
            .map_err(|e| anyhow::anyhow!("Failed to fetch local shortcuts: {}", e))?;

        let mut synced_count = 0;

        // 2. Iterate and sync to Postgres
        for local in local_shortcuts {
            // Check if exists in remote
            let remote_exists = self.postgres_shortcut_repo.find_by_user_and_action(&local.user_id, &local.action).await
                .map_err(|e| anyhow::anyhow!("Failed to check remote shortcut: {}", e))?;

            if let Some(remote) = remote_exists {
                // Determine if we should update. 
                // For now, let's assume local is authority (Backup Local -> Cloud).
                // Or compare updated_at.
                // Simpler: Just update remote to match local.
                let mut to_update = local.clone();
                // Ensure ID matches remote if needed? 
                // Wait, if IDs are different (e.g. UUID vs Text, or generated differently), we rely on User + Action as unique key.
                // The repo's update method typically uses ID.
                // If remote has a different ID for the same User+Action, we should use the remote ID for the update call.
                
                to_update.id = remote.id; 
                self.postgres_shortcut_repo.update(&to_update).await
                     .map_err(|e| anyhow::anyhow!("Failed to update remote shortcut: {}", e))?;
                synced_count += 1;
            } else {
                // Create new
                // We might need to generate a new UUID for Postgres if the local ID isn't a valid UUID, 
                // but our SQLite implementation uses UUID strings so it should be fine.
                // However, the Postgres repo expects valid UUIDs.
                // Let's try to use the same ID.
                self.postgres_shortcut_repo.save(&local).await
                    .map_err(|e| anyhow::anyhow!("Failed to save remote shortcut: {}", e))?;
                synced_count += 1;
            }
        }

        info!("Backed up {} shortcuts for user {}", synced_count, user_id_str);

        Ok(BackupShortcutsResponse {
            message: format!("Successfully backed up {} shortcuts", synced_count),
        })
    }
}
