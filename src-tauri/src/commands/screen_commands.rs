use tauri::command;
use xcap::Monitor;
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};

#[command]
pub async fn capture_screen() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    
    // Capture the first monitor (primary usually)
    if let Some(monitor) = monitors.first() {
        let image = monitor.capture_image().map_err(|e| e.to_string())?;
        
        // Convert to PNG bytes
        let mut bytes: Vec<u8> = Vec::new();
        image.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)
            .map_err(|e| e.to_string())?;
            
        // Encode to base64
        let base64_string = general_purpose::STANDARD.encode(&bytes);
        Ok(format!("data:image/png;base64,{}", base64_string))
    } else {
        Err("No monitors found".to_string())
    }
}
