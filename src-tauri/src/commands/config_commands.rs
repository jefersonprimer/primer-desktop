use tauri::State;
use crate::app_state::AppState;
use crate::domain::config::entity::AppConfig;

#[tauri::command]
pub async fn get_app_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    state.config_repo.get()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_language(language: String, state: State<'_, AppState>) -> Result<(), String> {
    state.config_repo.set_language(&language)
        .await
        .map_err(|e| e.to_string())
}
