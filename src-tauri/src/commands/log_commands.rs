use tauri::{AppHandle, Manager, Runtime};
use std::fs;
use std::process::Command;
use std::path::PathBuf;

#[tauri::command]
pub async fn open_log_folder<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("logs");

    let target_dir = if log_dir.exists() {
        log_dir
    } else if data_dir.exists() {
        data_dir
    } else {
        // Fallback to log_dir even if it doesn't exist, so the OS might show an error or open the parent
        log_dir
    };
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(target_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(target_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(target_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn find_latest_log(dir: PathBuf) -> Result<Option<(PathBuf, std::time::SystemTime)>, String> {
    if !dir.exists() {
        return Ok(None);
    }

    let mut entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut latest_log: Option<(PathBuf, std::time::SystemTime)> = None;

    while let Some(entry) = entries.next() {
        if let Ok(entry) = entry {
            let path = entry.path();
            if let Some(extension) = path.extension() {
                if extension == "log" {
                    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
                    let modified = metadata.modified().map_err(|e| e.to_string())?;
                    
                    if let Some((_, latest_time)) = latest_log {
                        if modified > latest_time {
                            latest_log = Some((path, modified));
                        }
                    } else {
                        latest_log = Some((path, modified));
                    }
                }
            }
        }
    }
    Ok(latest_log)
}

#[tauri::command]
pub async fn read_log_content<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("logs");

    // Try finding logs in app_log_dir
    if let Ok(Some((path, _))) = find_latest_log(log_dir.clone()) {
        return fs::read_to_string(path).map_err(|e| e.to_string());
    }

    // Try finding logs in app_data_dir/logs
    match find_latest_log(data_dir.clone()) {
        Ok(Some((path, _))) => {
            return fs::read_to_string(path).map_err(|e| e.to_string());
        }
        _ => {}
    }

    Err(format!("No log file found. Searched in: {:?} and {:?}", log_dir, data_dir))
}

#[tauri::command]
pub async fn get_log_path_cmd<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("logs");

    if log_dir.exists() {
        Ok(log_dir.to_string_lossy().to_string())
    } else if data_dir.exists() {
        Ok(data_dir.to_string_lossy().to_string())
    } else {
        // Return default preference
        Ok(log_dir.to_string_lossy().to_string())
    }
}
