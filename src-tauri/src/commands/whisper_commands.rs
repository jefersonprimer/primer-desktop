use tauri::{AppHandle, Manager, Runtime};
use std::process::Command;

#[cfg(target_os = "linux")]
#[tauri::command]
pub async fn transcribe_with_whisper<R: Runtime>(
    app: AppHandle<R>,
    audio_path: String,
    model: String,
) -> Result<String, String> {
    use tauri::path::BaseDirectory;
    use log::{info, error};

    info!("[Whisper] Starting transcription for file: {} with model: {}", audio_path, model);

    let resource_path = app
        .path()
        .resolve("resources/whisper.cpp/whisper", BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve whisper binary path: {}", e))?;

    let model_path = app
        .path()
        .resolve(
            format!("resources/whisper.cpp/models/ggml-{}.bin", model),
            BaseDirectory::Resource,
        )
        .map_err(|e| format!("Failed to resolve model path: {}", e))?;

    info!("[Whisper] Binary path: {:?}", resource_path);
    info!("[Whisper] Model path: {:?}", model_path);

    if !resource_path.exists() {
         error!("[Whisper] Binary not found at {:?}", resource_path);
         return Err(format!("Whisper binary not found at {:?}", resource_path));
    }
    if !model_path.exists() {
         error!("[Whisper] Model not found at {:?}", model_path);
         return Err(format!("Model not found at {:?}", model_path));
    }

    // -m model
    // -f file
    // -l pt (Portuguese)
    // -nt (No timestamps)
    info!("[Whisper] Executing whisper command...");
    let output = Command::new(resource_path)
        .arg("-m")
        .arg(model_path)
        .arg("-f")
        .arg(&audio_path)
        .arg("-l")
        .arg("pt") 
        .arg("-nt") 
        .output()
        .map_err(|e| format!("Failed to execute whisper: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!("[Whisper] Command failed: {}", stderr);
        return Err(format!("Whisper failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim().to_string();
    info!("[Whisper] Transcription success. Length: {}", trimmed.len());
    info!("[Whisper] Transcription result: {}", trimmed);
    
    Ok(trimmed)
}

#[cfg(not(target_os = "linux"))]
#[tauri::command]
pub async fn transcribe_with_whisper<R: Runtime>(
    _app: AppHandle<R>,
    _audio_path: String,
    _model: String,
) -> Result<String, String> {
    Err("Whisper is only supported on Linux".to_string())
}
