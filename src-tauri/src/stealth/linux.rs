use tauri::{WebviewWindow, Emitter, Runtime};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use xcap::Monitor;
use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use std::ptr;
use std::ffi::CString;

// Global flag to control the capture loop
static CAPTURE_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, serde::Serialize)]
struct CaptureFrame {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

pub fn enable_stealth_mode<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
    println!("Detected Display Server: X11");
    enable_stealth_x11(window)
}

pub fn disable_stealth_mode<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
    disable_stealth_x11(window)
}

fn enable_stealth_x11<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
    set_hide_taskbar_x11(window, true)?;
    set_click_through_x11(window, true)?;
    start_capture_loop(window)
}

fn disable_stealth_x11<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
    stop_capture_loop();
    set_click_through_x11(window, false)?;
    set_hide_taskbar_x11(window, false)?;
    Ok(())
}

fn set_hide_taskbar_x11<R: Runtime>(window: &WebviewWindow<R>, enable: bool) -> Result<(), String> {
    if let Ok(handle) = window.window_handle() {
        if let RawWindowHandle::Xlib(xlib_handle) = handle.as_raw() {
            let window_id = xlib_handle.window;
            unsafe {
                let display = x11::xlib::XOpenDisplay(ptr::null());
                if display.is_null() {
                    return Err("Failed to open X display".to_string());
                }

                let net_wm_state = x11::xlib::XInternAtom(display, CString::new("_NET_WM_STATE").unwrap().as_ptr(), x11::xlib::False);
                let skip_taskbar = x11::xlib::XInternAtom(display, CString::new("_NET_WM_STATE_SKIP_TASKBAR").unwrap().as_ptr(), x11::xlib::False);
                let skip_pager = x11::xlib::XInternAtom(display, CString::new("_NET_WM_STATE_SKIP_PAGER").unwrap().as_ptr(), x11::xlib::False);
                let wm_state_above = x11::xlib::XInternAtom(display, CString::new("_NET_WM_STATE_ABOVE").unwrap().as_ptr(), x11::xlib::False);

                let mut atoms = vec![];
                // Always include ABOVE state
                atoms.push(wm_state_above);

                if enable {
                    atoms.push(skip_taskbar);
                    atoms.push(skip_pager);
                    
                     x11::xlib::XChangeProperty(
                        display,
                        window_id,
                        net_wm_state,
                        x11::xlib::XA_ATOM,
                        32,
                        x11::xlib::PropModeReplace,
                        atoms.as_ptr() as *const u8,
                        atoms.len() as i32,
                    );
                } else {
                    // removing properties requires a different approach or just setting empty (but keeping ABOVE)
                     x11::xlib::XChangeProperty(
                        display,
                        window_id,
                        net_wm_state,
                        x11::xlib::XA_ATOM,
                        32,
                        x11::xlib::PropModeReplace,
                        atoms.as_ptr() as *const u8,
                        atoms.len() as i32,
                    );
                }

                x11::xlib::XFlush(display);
                x11::xlib::XCloseDisplay(display);
            }
            return Ok(());
        }
    }
    Err("Not running on X11 or failed to get window handle".to_string())
}

fn set_click_through_x11<R: Runtime>(window: &WebviewWindow<R>, enable: bool) -> Result<(), String> {
    if let Ok(handle) = window.window_handle() {
        if let RawWindowHandle::Xlib(xlib_handle) = handle.as_raw() {
            let window_id = xlib_handle.window;
            unsafe {
                 let display = x11::xlib::XOpenDisplay(ptr::null());
                if display.is_null() {
                    return Err("Failed to open X display".to_string());
                }

                if enable {
                    // Create an empty region
                    let region = x11::xfixes::XFixesCreateRegion(display, ptr::null_mut(), 0);
                    // 2 is ShapeInput
                    x11::xfixes::XFixesSetWindowShapeRegion(display, window_id, 2, 0, 0, region);
                    x11::xfixes::XFixesDestroyRegion(display, region);
                } else {
                    // Reset to default (None removes the shape constraint)
                    // 2 is ShapeInput
                    x11::xfixes::XFixesSetWindowShapeRegion(display, window_id, 2, 0, 0, 0);
                }
                
                x11::xlib::XFlush(display);
                x11::xlib::XCloseDisplay(display);
            }
             return Ok(());
        }
    }
     Err("Not running on X11 or failed to get window handle".to_string())
}

fn start_capture_loop<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
    if CAPTURE_RUNNING.load(Ordering::SeqCst) {
        return Ok(()); // Already running
    }
    
    CAPTURE_RUNNING.store(true, Ordering::SeqCst);
    let window_handle = window.clone();

    thread::spawn(move || {
        println!("Starting Stealth Capture Loop (via xcap)...");
        
        let mut monitors = Vec::new();
        for _ in 0..5 {
            match Monitor::all() {
                Ok(m) if !m.is_empty() => {
                    monitors = m;
                    break;
                }
                _ => thread::sleep(Duration::from_millis(500)),
            }
        }

        if monitors.is_empty() {
             eprintln!("No monitors found via xcap. Capture disabled.");
             CAPTURE_RUNNING.store(false, Ordering::SeqCst);
             return;
        }

        let monitor = monitors.into_iter().next().unwrap();
        println!("Capturing monitor: {:?}", monitor.name());

        while CAPTURE_RUNNING.load(Ordering::SeqCst) {
            match monitor.capture_image() {
                Ok(image) => {
                     let width = image.width();
                     let height = image.height();
                     let data = image.into_raw(); 

                     let frame = CaptureFrame {
                        width,
                        height,
                        data,
                     };
                     
                     let _ = window_handle.emit("stealth-frame", frame);
                }
                Err(e) => {
                    eprintln!("Capture failed: {}", e);
                    thread::sleep(Duration::from_millis(1000));
                }
            }
            thread::sleep(Duration::from_millis(66)); 
        }
        
        println!("Stealth Capture Loop Stopped.");
    });

    Ok(())
}

fn stop_capture_loop() {
    CAPTURE_RUNNING.store(false, Ordering::SeqCst);
}

