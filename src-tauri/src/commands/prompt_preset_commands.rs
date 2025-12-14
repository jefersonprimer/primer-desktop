use tauri::State;
use crate::app_state::AppState;
use crate::domain::prompt_preset::entity::PromptPreset;
use serde::Deserialize;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct CreatePromptPresetDto {
    pub name: String,
    pub description: Option<String>,
    pub prompt: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePromptPresetDto {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub prompt: String,
}

#[tauri::command]
pub async fn get_prompt_presets(state: State<'_, AppState>) -> Result<Vec<PromptPreset>, String> {
    state.prompt_preset_repo.find_all()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_prompt_preset(dto: CreatePromptPresetDto, state: State<'_, AppState>) -> Result<PromptPreset, String> {
    let preset = PromptPreset {
        id: Uuid::new_v4().to_string(),
        name: dto.name,
        description: dto.description,
        prompt: dto.prompt,
        is_built_in: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    state.prompt_preset_repo.save(&preset)
        .await
        .map(|_| preset)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_prompt_preset(dto: UpdatePromptPresetDto, state: State<'_, AppState>) -> Result<PromptPreset, String> {
    let mut preset = state.prompt_preset_repo.find_by_id(&dto.id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Prompt preset not found".to_string())?;

    if preset.is_built_in {
        return Err("Cannot update built-in preset".to_string());
    }

    preset.name = dto.name;
    preset.description = dto.description;
    preset.prompt = dto.prompt;
    preset.updated_at = Utc::now();

    state.prompt_preset_repo.update(&preset)
        .await
        .map(|_| preset)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_prompt_preset(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let preset = state.prompt_preset_repo.find_by_id(&id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Prompt preset not found".to_string())?;

    if preset.is_built_in {
        return Err("Cannot delete built-in preset".to_string());
    }

    state.prompt_preset_repo.delete(&id)
        .await
        .map_err(|e| e.to_string())
}
