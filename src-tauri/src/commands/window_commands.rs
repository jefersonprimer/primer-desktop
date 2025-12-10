use tauri::{Runtime, WebviewWindow};

#[tauri::command]
pub async fn set_stealth_mode<R: Runtime>(window: WebviewWindow<R>, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return crate::stealth::macos::set_stealth_mode(&window, enabled);
    #[cfg(target_os = "linux")]
    {
        if enabled {
            crate::stealth::linux::enable_stealth_mode(&window)
        } else {
            crate::stealth::linux::disable_stealth_mode(&window)
        }
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    Err("Stealth mode is only available on macOS and Linux".to_string())
}

#[tauri::command]
pub async fn set_always_on_top<R: Runtime>(window: WebviewWindow<R>, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return crate::stealth::macos::set_always_on_top(&window, enabled);
    #[cfg(target_os = "linux")]
    {
        use std::ffi::CString;
        use x11::xlib::{XChangeProperty, XCloseDisplay, XFlush, XInternAtom, XOpenDisplay, PropModeReplace, XA_ATOM};
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        use std::ptr;

        let xid = match window.window_handle().map_err(|e| e.to_string())?.as_raw() {
            RawWindowHandle::Xlib(h) => h.window,
            _ => return Err("Not running on X11.".to_string()),
        };

        unsafe {
            let display = XOpenDisplay(ptr::null());
            if display.is_null() {
                return Err("Failed to open X display".to_string());
            }

            let net_wm_state = XInternAtom(display, CString::new("_NET_WM_STATE").unwrap().as_ptr(), x11::xlib::False);
            let net_wm_state_above = XInternAtom(display, CString::new("_NET_WM_STATE_ABOVE").unwrap().as_ptr(), x11::xlib::False);

            let mut atoms = Vec::new();
            if enabled {
                atoms.push(net_wm_state_above);
            }
            // To be truly correct, we should read the existing _NET_WM_STATE property,
            // add/remove _NET_WM_STATE_ABOVE, and then write it back.
            // For now, this replaces the state.

            XChangeProperty(
                display,
                xid,
                net_wm_state,
                XA_ATOM,
                32,
                PropModeReplace,
                atoms.as_ptr() as *const u8,
                atoms.len() as i32,
            );

            XFlush(display);
            XCloseDisplay(display);
        }
        Ok(())
    }
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, HWND_TOPMOST, HWND_NOTOPMOST, SWP_NOMOVE, SWP_NOSIZE};
        use windows::Win32::Foundation::HWND;
        use tauri::raw_window_handle::{HasWindowHandle, RawWindowHandle};

        let handle = window.window_handle().map_err(|e| e.to_string())?;
        let hwnd = match handle.as_ref() {
            RawWindowHandle::Win32(handle) => HWND(handle.hwnd.get() as isize),
            _ => return Err("Not a Windows window".to_string()),
        };

        unsafe {
            let hwnd_insert_after = if enabled { HWND_TOPMOST } else { HWND_NOTOPMOST };
            let _ = SetWindowPos(hwnd, hwnd_insert_after, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
        }
        Ok(())
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    Err("Always on top is only available on macOS, Windows and Linux".to_string())
}

#[tauri::command]
pub async fn set_window_opacity<R: Runtime>(window: WebviewWindow<R>, opacity: f64) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return crate::stealth::macos::set_window_opacity(&window, opacity);
    #[cfg(target_os = "linux")]
    {
        use std::ffi::CString;
        use x11::xlib::{XChangeProperty, XCloseDisplay, XFlush, XInternAtom, XOpenDisplay, PropModeReplace, XA_CARDINAL};
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        use std::ptr;

        let xid = match window.window_handle().map_err(|e| e.to_string())?.as_raw() {
            RawWindowHandle::Xlib(h) => h.window,
            _ => return Err("Not running on X11.".to_string()),
        };

        unsafe {
            let display = XOpenDisplay(ptr::null());
            if display.is_null() {
                return Err("Failed to open X display".to_string());
            }

            let opacity_atom = XInternAtom(display, CString::new("_NET_WM_WINDOW_OPACITY").unwrap().as_ptr(), x11::xlib::False);
            let value = (opacity * 0xFFFFFFFFu32 as f64) as u32; // Scale 0.0-1.0 to 0-0xFFFFFFFF

            XChangeProperty(
                display,
                xid,
                opacity_atom,
                XA_CARDINAL, // CARDINAL type
                32,
                PropModeReplace,
                &value as *const u32 as *const u8,
                1, // 1 element (a single u32)
            );

            XFlush(display);
            XCloseDisplay(display);
        }
        Ok(())
    }
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{
            GetWindowLongPtrW, SetWindowLongPtrW, SetLayeredWindowAttributes,
            GWL_EXSTYLE, WS_EX_LAYERED, LWA_ALPHA,
        };
        use windows::Win32::Foundation::HWND;
        use tauri::raw_window_handle::{HasWindowHandle, RawWindowHandle};

        let handle = window.window_handle().map_err(|e| e.to_string())?;
        let hwnd = match handle.as_ref() {
            RawWindowHandle::Win32(handle) => HWND(handle.hwnd.get() as isize),
            _ => return Err("Not a Windows window".to_string()),
        };

        unsafe {
            // Ensure WS_EX_LAYERED is set
            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
            if (ex_style & (WS_EX_LAYERED.0 as isize)) == 0 {
                SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex_style | (WS_EX_LAYERED.0 as isize));
            }

            let alpha = (opacity * 255.0) as u8;
            let _ = SetLayeredWindowAttributes(hwnd, windows::Win32::Foundation::COLORREF(0), alpha, LWA_ALPHA);
        }
        Ok(())
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    Err("Window opacity is only available on macOS, Windows and Linux".to_string())
}

#[tauri::command]
pub async fn get_window_opacity<R: Runtime>(window: WebviewWindow<R>) -> Result<f64, String> {
    #[cfg(target_os = "macos")]
    return crate::stealth::macos::get_window_opacity(&window);
    #[cfg(target_os = "linux")]
    {
        use std::ffi::CString;
        use std::ffi::{c_int, c_ulong};
        use x11::xlib::{XGetWindowProperty, XCloseDisplay, XInternAtom, XOpenDisplay, AnyPropertyType, Success};
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        use std::ptr;

        let xid = match window.window_handle().map_err(|e| e.to_string())?.as_raw() {
            RawWindowHandle::Xlib(h) => h.window,
            _ => return Err("Not running on X11.".to_string()),
        };

        unsafe {
            let display = XOpenDisplay(ptr::null());
            if display.is_null() {
                return Err("Failed to open X display".to_string());
            }

            let opacity_atom = XInternAtom(display, CString::new("_NET_WM_WINDOW_OPACITY").unwrap().as_ptr(), x11::xlib::False);
            let mut actual_type: x11::xlib::Atom = 0;
            let mut actual_format: c_int = 0;
            let mut nitems: c_ulong = 0;
            let mut bytes_after: c_ulong = 0;
            let mut prop_return: *mut u8 = ptr::null_mut();

            let status = XGetWindowProperty(
                display,
                xid,
                opacity_atom,
                0, // offset
                4, // length (sizeof(u32) in 32-bit units)
                x11::xlib::False, // delete
                AnyPropertyType as u64, // req_type
                &mut actual_type,
                &mut actual_format,
                &mut nitems,
                &mut bytes_after,
                &mut prop_return,
            );

            let mut opacity: f64 = 1.0; // Default to opaque

            if status == Success as c_int && !prop_return.is_null() && nitems == 1 && actual_format == 32 {
                let value = *(prop_return as *mut u32);
                opacity = value as f64 / 0xFFFFFFFFu32 as f64;
            }
            
            if !prop_return.is_null() {
                 x11::xlib::XFree(prop_return as *mut _);
            }
            XCloseDisplay(display);
            Ok(opacity)
        }
    }
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{
            GetLayeredWindowAttributes, LWA_ALPHA,
        };
        use windows::Win32::Foundation::HWND;
        use tauri::raw_window_handle::{HasWindowHandle, RawWindowHandle};

        let handle = window.window_handle().map_err(|e| e.to_string())?;
        let hwnd = match handle.as_ref() {
            RawWindowHandle::Win32(handle) => HWND(handle.hwnd.get() as isize),
            _ => return Err("Not a Windows window".to_string()),
        };

        unsafe {
             let mut key = windows::Win32::Foundation::COLORREF(0);
             let mut alpha: u8 = 0;
             let mut flags: u32 = 0;
             
             if GetLayeredWindowAttributes(hwnd, Some(&mut key), Some(&mut alpha), Some(&mut flags)).is_ok() {
                  if (flags & LWA_ALPHA.0) != 0 {
                      return Ok(alpha as f64 / 255.0);
                  }
             }
        }
        Ok(1.0)
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    Ok(1.0)
}

#[tauri::command]
pub async fn enable_full_stealth(window: WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return crate::stealth::macos::enable_full_stealth(&window);

    #[cfg(target_os = "windows")]
    {
         crate::stealth::windows::enable_stealth_mode(&window)?;
         crate::clickthrough::windows::set_click_through(&window, true)?;
         crate::visibility::windows::set_visibility_in_taskbar(&window, false)?;
         Ok(())
    }

    #[cfg(target_os = "linux")]
    {
         crate::stealth::linux::enable_stealth_mode(&window)?;
         crate::clickthrough::linux::set_click_through(&window, true)?;
         crate::visibility::linux::set_visibility_in_taskbar(&window, false)?;
         Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Full stealth is only available on macOS, Windows, and Linux".to_string())
}

#[tauri::command]
pub async fn disable_full_stealth(window: WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return crate::stealth::macos::disable_full_stealth(&window);

    #[cfg(target_os = "windows")]
    {
         crate::stealth::windows::disable_stealth_mode(&window)?;
         crate::clickthrough::windows::set_click_through(&window, false)?;
         crate::visibility::windows::set_visibility_in_taskbar(&window, true)?;
         Ok(())
    }

    #[cfg(target_os = "linux")]
    {
         crate::stealth::linux::disable_stealth_mode(&window)?;
         crate::clickthrough::linux::set_click_through(&window, false)?;
         crate::visibility::linux::set_visibility_in_taskbar(&window, true)?;
         Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Full stealth is only available on macOS, Windows, and Linux".to_string())
}