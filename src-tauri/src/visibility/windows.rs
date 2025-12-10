use tauri::WebviewWindow;
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_APPWINDOW, WS_EX_TOOLWINDOW,
};
use windows::Win32::Foundation::HWND;
use tauri::raw_window_handle::{HasWindowHandle, RawWindowHandle};

pub fn set_visibility_in_taskbar(window: &WebviewWindow, visible: bool) -> Result<(), String> {
    let handle = window.window_handle().map_err(|e| e.to_string())?;
    let hwnd = match handle.as_ref() {
        RawWindowHandle::Win32(handle) => HWND(handle.hwnd.get() as isize),
        _ => return Err("Not a Windows window".to_string()),
    };

    unsafe {
        let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
        if !visible {
            // Hide: Remove APPWINDOW, Add TOOLWINDOW
             SetWindowLongPtrW(
                hwnd,
                GWL_EXSTYLE,
                (ex_style & !(WS_EX_APPWINDOW.0 as isize)) | (WS_EX_TOOLWINDOW.0 as isize),
            );
        } else {
            // Show: Add APPWINDOW, Remove TOOLWINDOW
            SetWindowLongPtrW(
                hwnd,
                GWL_EXSTYLE,
                (ex_style & !(WS_EX_TOOLWINDOW.0 as isize)) | (WS_EX_APPWINDOW.0 as isize),
            );
        }
    }
    Ok(())
}
