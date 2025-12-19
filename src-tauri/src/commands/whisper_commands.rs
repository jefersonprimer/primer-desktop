use tauri::{AppHandle, Manager, Runtime};
use std::process::Command;
use serde::Serialize;
use std::fs;
use std::io::Write;
use futures_util::StreamExt;

#[derive(Serialize, Clone)]
pub struct WhisperModelStatus {
    pub name: String,
    pub exists: bool,
    pub path: String,
    pub size_desc: String,
    pub ram_desc: String,
}

#[derive(Serialize, Clone)]
pub struct DownloadProgress {
    pub name: String,
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
}

#[tauri::command]
pub async fn download_whisper_model<R: Runtime>(
    app: AppHandle<R>,
    name: String,
) -> Result<(), String> {
    use tauri::path::BaseDirectory;
    use tauri::Emitter;

    let file_name = format!("ggml-{}.bin", name);
    let models_dir = app
        .path()
        .resolve("resources/whisper.cpp/models", BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve models path: {}", e))?;

    if !models_dir.exists() {
        fs::create_dir_all(&models_dir).map_err(|e| format!("Failed to create models directory: {}", e))?;
    }

    let file_path = models_dir.join(&file_name);
    let url = format!(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{}",
        file_name
    );

    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    let total_size = response
        .content_length()
        .ok_or("Failed to get content length")?;

    let mut file = fs::File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Error while downloading: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Error while writing to file: {}", e))?;
        downloaded += chunk.len() as u64;

        let percentage = (downloaded as f64 / total_size as f64) * 100.0;
        let _ = app.emit(
            "whisper-download-progress",
            DownloadProgress {
                name: name.clone(),
                downloaded,
                total: total_size,
                percentage,
            },
        );
    }

    Ok(())
}

#[tauri::command]
pub async fn check_whisper_models<R: Runtime>(app: AppHandle<R>) -> Result<Vec<WhisperModelStatus>, String> {
    use tauri::path::BaseDirectory;
    
    let models = vec![
        ("tiny", "75 MB", "~390 MB"),
        ("base", "142 MB", "~500 MB"),
        ("small", "466 MB", "~1 GB"),
        ("medium", "1.5 GB", "~2.6 GB"),
        ("large", "2.9 GB", "~4.7 GB"),
    ];

    let mut statuses = Vec::new();

    for (name, size, ram) in models {
        let file_name = format!("ggml-{}.bin", name);
        let model_path_result = app
            .path()
            .resolve(
                format!("resources/whisper.cpp/models/{}", file_name),
                BaseDirectory::Resource,
            );

        match model_path_result {
            Ok(path) => {
                statuses.push(WhisperModelStatus {
                    name: name.to_string(),
                    exists: path.exists(),
                    path: path.to_string_lossy().to_string(),
                    size_desc: size.to_string(),
                    ram_desc: ram.to_string(),
                });
            }
            Err(_) => {
                 statuses.push(WhisperModelStatus {
                    name: name.to_string(),
                    exists: false,
                    path: "".to_string(),
                    size_desc: size.to_string(),
                    ram_desc: ram.to_string(),
                });
            }
        }
    }

    Ok(statuses)
}

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
