// src-tauri/src/clickthrough/mod.rs

use tauri::WebviewWindow;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos; // Placeholder for macOS

#[cfg(target_os = "linux")]
pub mod linux; // Placeholder for Linux

pub fn enable_click_through(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return windows::set_click_through(window, true);
    }
    #[cfg(target_os = "macos")]
    {
        return macos::set_click_through(window, true);
    }
    #[cfg(target_os = "linux")]
    {
        return linux::set_click_through(window, true);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Click-through not implemented for this OS".to_string())
    }
}

pub fn disable_click_through(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return windows::set_click_through(window, false);
    }
    #[cfg(target_os = "macos")]
    {
        return macos::set_click_through(window, false);
    }
    #[cfg(target_os = "linux")]
    {
        return linux::set_click_through(window, false);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Click-through not implemented for this OS".to_string())
    }
}

pub fn set_ignore_cursor_events(window: &WebviewWindow, ignore: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return windows::set_click_through(window, ignore);
    }
    #[cfg(target_os = "macos")]
    {
        return macos::set_click_through(window, ignore);
    }
    #[cfg(target_os = "linux")]
    {
        return linux::set_click_through(window, ignore);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Click-through not implemented for this OS".to_string())
    }
}

pub fn toggle_click_through(_window: &WebviewWindow) -> Result<(), String> {
    // This will require getting the current state, which is more complex
    // For now, we'll just have enable/disable
    Err("Toggle click-through not yet implemented".to_string())
}
