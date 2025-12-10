use tauri::WebviewWindow;

pub fn set_click_through(window: &WebviewWindow, enable: bool) -> Result<(), String> {
    crate::stealth::macos::set_click_through(window, enable)
}
