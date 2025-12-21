use tauri::State;
use crate::app_state::AppState;
use crate::domain::config::entity::AppConfig;
use std::process::Command;

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

#[tauri::command]
pub async fn open_system_settings(setting_type: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let url = match setting_type.as_str() {
            "microphone" => "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
            "screen" => "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
            _ => "x-apple.systempreferences:com.apple.preference.security",
        };
        Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        let url = match setting_type.as_str() {
            "microphone" => "ms-settings:privacy-microphone",
            // Windows doesn't have a specific global screen capture permission URI like macOS, 
            // but privacy settings is a good start.
            "screen" => "ms-settings:privacy", 
            _ => "ms-settings:privacy",
        };
        Command::new("cmd")
            .args(&["/C", "start", url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Best effort for GNOME, might fail on others silently
        if setting_type == "microphone" {
             let _ = Command::new("gnome-control-center")
                .arg("sound")
                .spawn();
        } else {
             let _ = Command::new("gnome-control-center")
                .spawn();
        }
    }

    Ok(())
}
