use tauri::WebviewWindow;

pub fn set_visibility_in_taskbar(_window: &WebviewWindow, visible: bool) -> Result<(), String> {
    if visible {
        crate::stealth::macos::show_in_dock()
    } else {
        crate::stealth::macos::hide_from_dock()
    }
}
