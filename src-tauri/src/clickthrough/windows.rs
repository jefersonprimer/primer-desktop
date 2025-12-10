use tauri::WebviewWindow;
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_LAYERED, WS_EX_TRANSPARENT,
};
use windows::Win32::Foundation::HWND;
use tauri::raw_window_handle::{HasWindowHandle, RawWindowHandle};

pub fn set_click_through(window: &WebviewWindow, enable: bool) -> Result<(), String> {
    let handle = window.window_handle().map_err(|e| e.to_string())?;
    let hwnd = match handle.as_ref() {
        RawWindowHandle::Win32(handle) => HWND(handle.hwnd.get() as isize),
        _ => return Err("Not a Windows window".to_string()),
    };

    unsafe {
        let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
        if enable {
            SetWindowLongPtrW(
                hwnd,
                GWL_EXSTYLE,
                ex_style | (WS_EX_TRANSPARENT.0 as isize) | (WS_EX_LAYERED.0 as isize),
            );
        } else {
            SetWindowLongPtrW(
                hwnd,
                GWL_EXSTYLE,
                ex_style & !(WS_EX_TRANSPARENT.0 as isize),
            );
        }
    }
    Ok(())
}
