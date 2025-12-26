use tauri::{State, command};
use crate::app_state::AppState;
use crate::domain::changelog::entity::Changelog;

#[command]
pub async fn get_changelogs(state: State<'_, AppState>) -> Result<Vec<Changelog>, String> {
    state.changelog_repo.get_all().await.map_err(|e| e.to_string())
}
