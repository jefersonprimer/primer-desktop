use tauri::WebviewWindow;
use serde::{Serialize, Deserialize};
use std::sync::Mutex;
use lazy_static::lazy_static;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum StealthMethod {
    NativeAPI,      // macOS
    RealtimeMirror, // Windows/Linux
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StealthStatus {
    pub active: bool,
    pub method: StealthMethod,
    pub click_through: bool,
    pub hidden_from_dock: bool,
    pub os: String,
}

lazy_static! {
    static ref STEALTH_STATE: Mutex<StealthStatus> = Mutex::new(StealthStatus {
        active: false,
        method: if cfg!(target_os = "macos") { StealthMethod::NativeAPI } else { StealthMethod::RealtimeMirror },
        click_through: false,
        hidden_from_dock: false,
        os: std::env::consts::OS.to_string(),
    });
}

pub fn update_click_through_state(active: bool) {
    if let Ok(mut state) = STEALTH_STATE.lock() {
        state.click_through = active;
    }
}

pub fn update_hidden_from_dock_state(hidden: bool) {
    if let Ok(mut state) = STEALTH_STATE.lock() {
        state.hidden_from_dock = hidden;
    }
}

pub fn enable_stealth_mode(window: &WebviewWindow) -> Result<StealthStatus, String> {
    let result = {
        #[cfg(target_os = "macos")]
        { macos::enable_stealth_mode(window) }
        #[cfg(target_os = "windows")]
        { windows::enable_stealth_mode(window) }
        #[cfg(target_os = "linux")]
        { linux::enable_stealth_mode(window) }
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        { Err("Stealth mode not implemented for this OS".to_string()) }
    };

    if result.is_ok() {
        if let Ok(mut state) = STEALTH_STATE.lock() {
            state.active = true;
        }
    }
    
    result.and_then(|_| get_stealth_status())
}

pub fn disable_stealth_mode(window: &WebviewWindow) -> Result<(), String> {
    let result = {
        #[cfg(target_os = "macos")]
        { macos::disable_stealth_mode(window) }
        #[cfg(target_os = "windows")]
        { windows::disable_stealth_mode(window) }
        #[cfg(target_os = "linux")]
        { linux::disable_stealth_mode(window) }
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        { Err("Stealth mode not implemented for this OS".to_string()) }
    };

    if result.is_ok() {
         if let Ok(mut state) = STEALTH_STATE.lock() {
            state.active = false;
        }
    }
    result
}

pub fn get_stealth_status() -> Result<StealthStatus, String> {
    STEALTH_STATE.lock()
        .map(|state| state.clone())
        .map_err(|e| e.to_string())
}

