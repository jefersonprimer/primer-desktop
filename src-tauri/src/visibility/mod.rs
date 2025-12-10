// src-tauri/src/visibility/mod.rs

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos; // Placeholder for macOS

#[cfg(target_os = "linux")]
pub mod linux; // Placeholder for Linux

use tauri::WebviewWindow;

pub fn hide_from_taskbar(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return windows::set_visibility_in_taskbar(window, false);
    }
    #[cfg(target_os = "macos")]
    {
        return macos::set_visibility_in_taskbar(window, false);
    }
    #[cfg(target_os = "linux")]
    {
        return linux::set_visibility_in_taskbar(window, false);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Hide from taskbar not implemented for this OS".to_string())
    }
}

pub fn show_in_taskbar(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return windows::set_visibility_in_taskbar(window, true);
    }
    #[cfg(target_os = "macos")]
    {
        return macos::set_visibility_in_taskbar(window, true);
    }
    #[cfg(target_os = "linux")]
    {
        return linux::set_visibility_in_taskbar(window, true);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Show in taskbar not implemented for this OS".to_string())
    }
}