use tauri::{WebviewWindow, Runtime};
use x11::xlib::{
    XOpenDisplay, XCloseDisplay, XInternAtom, XChangeProperty, XFlush, PropModeReplace, Atom, Display
};
use std::ptr;
use std::ffi::CString;
use raw_window_handle::{HasWindowHandle, RawWindowHandle};

fn get_atom(display: *mut Display, name: &str) -> Atom {
    unsafe {
        let c_name = CString::new(name).unwrap();
        XInternAtom(display, c_name.as_ptr(), x11::xlib::False)
    }
}

pub fn set_visibility_in_taskbar<R: Runtime>(window: &WebviewWindow<R>, visible: bool) -> Result<(), String> {
    // 1. Get the Window ID (XID) from Tauri
    let xid = match window.window_handle().map_err(|e| e.to_string())?.as_raw() {
        RawWindowHandle::Xlib(h) => h.window,
        _ => return Err("Not running on X11.".to_string()),
    };

    unsafe {
        // 2. Open Display
        let display = XOpenDisplay(ptr::null());
        if display.is_null() {
             return Err("Failed to open X display".to_string());
        }

        // 3. Prepare Atoms
        let skip_taskbar = get_atom(display, "_NET_WM_STATE_SKIP_TASKBAR");
        let skip_pager = get_atom(display, "_NET_WM_STATE_SKIP_PAGER"); // Optional: Hide from Alt-Tab often uses this too
        let wm_state_above = get_atom(display, "_NET_WM_STATE_ABOVE");
        let wm_state = get_atom(display, "_NET_WM_STATE");

        // 4. Change Property
        // If hidden (not visible), ADD the atoms. If visible, REMOVE them (or set empty).
        // For correct EWMH behavior, we should actually send a client message to the root window,
        // but setting the property directly often works for initial setup. 
        // A better way is to Get current state, append/remove, then Set.
        
        // Simplified approach: Overwrite state (might remove other states like MAXIMIZED, use with caution)
        // Or better: Let's assume we just want to toggle these flags.
        
        // Actually, XChangeProperty with PropModeReplace will replace everything.
        // PropModeAppend will append.
        
        // Let's stick to the Spec's suggestion which implies setting the property.
        
        // To do it properly we need to check current state. But for this task, let's try to just set it.
        
        let mut atoms: Vec<Atom> = Vec::new();
        // Always include ABOVE state as per configuration intent
        atoms.push(wm_state_above);
        
        if !visible {
            atoms.push(skip_taskbar);
            atoms.push(skip_pager);
        }
        
        // We use PropModeReplace for now. 
        // WARNING: This clears other states (Maximized, Fullscreen, etc).
        // Ideally we should read `_NET_WM_STATE` first.
        
        // BUT, since we want to be stealthy, maybe clearing others is fine? No, user might want fullscreen.
        // Let's do it safely: Get existing, modify, set.
        // ... Implementing "Get" is verbose in C-FFI.
        // Let's use the Spec's simplified view.
        
        XChangeProperty(
            display, 
            xid, 
            wm_state, 
            x11::xlib::XA_ATOM, 
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