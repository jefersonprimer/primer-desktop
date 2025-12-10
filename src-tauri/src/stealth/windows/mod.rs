pub mod capture;
pub mod renderer;
pub mod filter;
pub mod fake_window;
pub mod manager;

pub use manager::WindowsStealth;

use tauri::WebviewWindow;
use parking_lot::Mutex;
use std::sync::Arc;
use lazy_static::lazy_static;

lazy_static! {
    static ref WINDOWS_STEALTH: Mutex<Option<WindowsStealth>> = Mutex::new(None);
}

pub fn enable_stealth_mode(window: &WebviewWindow) -> Result<(), String> {
    use tauri::raw_window_handle::{HasWindowHandle, RawWindowHandle};
    use windows::Win32::Foundation::HWND;

    let handle = window.window_handle().map_err(|e| e.to_string())?;
    let hwnd = match handle.as_ref() {
        RawWindowHandle::Win32(handle) => HWND(handle.hwnd.get() as isize),
        _ => return Err("Not a Windows window".to_string()),
    };

    let mut guard = WINDOWS_STEALTH.lock();
    if guard.is_none() {
        let stealth = WindowsStealth::new(hwnd).map_err(|e| e.to_string())?;
        *guard = Some(stealth);
    }

    if let Some(stealth) = guard.as_mut() {
        stealth.enable().map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn disable_stealth_mode(_window: &WebviewWindow) -> Result<(), String> {
    let mut guard = WINDOWS_STEALTH.lock();
    if let Some(stealth) = guard.as_mut() {
        stealth.disable().map_err(|e| e.to_string())?;
    }
    Ok(())
}
