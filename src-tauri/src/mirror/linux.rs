// src-tauri/src/mirror/linux.rs

use super::CaptureFrame;
use x11::xlib::{self, Display, XErrorEvent};
// No direct use x11::xcomposite as it's not resolved
use std::ptr;
use std::slice;
use std::sync::atomic::{AtomicBool, Ordering};

// Define XComposite constants and functions ourselves
const COMPOSITE_REDIRECT_AUTOMATIC: i32 = 1; // From x11/extensions/Xcomposite.h

extern "C" {
    pub fn XCompositeRedirectWindow(
        dpy: *mut xlib::Display,
        window: xlib::Window,
        update: i32, // CompositeRedirectAutomatic
    );
    pub fn XCompositeUnredirectWindow(
        dpy: *mut xlib::Display,
        window: xlib::Window,
        update: i32, // CompositeRedirectAutomatic
    );
    pub fn XCompositeQueryExtension(
        dpy: *mut xlib::Display,
        event_base_return: *mut i32,
        error_base_return: *mut i32,
    ) -> xlib::Bool;
}

// Global flag to track if XComposite redirect is active
static XCOMPOSITE_REDIRECT_ACTIVE: AtomicBool = AtomicBool::new(false);

// X error handler to catch issues with XComposite
unsafe extern "C" fn on_x_error(
    _display: *mut xlib::Display,
    error_event: *mut xlib::XErrorEvent,
) -> i32 {
    let error_code = (*error_event).error_code;
    eprintln!("X Error occurred: code = {}", error_code);
    0 // Return 0 to indicate the error was handled
}


pub fn capture_desktop_x11(use_composite: bool) -> Result<CaptureFrame, String> {
    unsafe {
        let display = xlib::XOpenDisplay(ptr::null());
        if display.is_null() {
            return Err("Failed to open X display".to_string());
        }

        let root = xlib::XDefaultRootWindow(display);

        // Set up custom error handler for X operations
        let old_error_handler = xlib::XSetErrorHandler(Some(on_x_error));

        let mut image_ptr: *mut xlib::XImage = ptr::null_mut();

        if use_composite {
            // Check if XComposite extension is available
            let mut event_base = 0;
            let mut error_base = 0;
            if XCompositeQueryExtension(display, &mut event_base, &mut error_base) == xlib::False { 
                eprintln!("XComposite extension not available, falling back to XGetImage.");
                XCOMPOSITE_REDIRECT_ACTIVE.store(false, Ordering::SeqCst);
            } else {
                if !XCOMPOSITE_REDIRECT_ACTIVE.load(Ordering::SeqCst) {
                    eprintln!("Attempting XCompositeRedirectWindow...");
                    XCompositeRedirectWindow(display, root, COMPOSITE_REDIRECT_AUTOMATIC);
                    xlib::XSync(display, xlib::False);
                    XCOMPOSITE_REDIRECT_ACTIVE.store(true, Ordering::SeqCst);
                    eprintln!("XCompositeRedirectWindow successful.");
                }
            }
        }
        
        // Fallback or if XComposite is active but we still use XGetImage
        let mut attrs: xlib::XWindowAttributes = std::mem::zeroed();
        if xlib::XGetWindowAttributes(display, root, &mut attrs) == 0 {
            xlib::XSetErrorHandler(old_error_handler);
            xlib::XCloseDisplay(display);
            return Err("Failed to get window attributes".to_string());
        }
        
        let width = attrs.width as u32;
        let height = attrs.height as u32;
        
        image_ptr = xlib::XGetImage(
            display,
            root,
            0, 0,
            width, height,
            xlib::XAllPlanes(),
            xlib::ZPixmap
        );
        
        if image_ptr.is_null() {
            xlib::XSetErrorHandler(old_error_handler);
            xlib::XCloseDisplay(display);
            return Err("Failed to get image from X server".to_string());
        }
        
        let image = *image_ptr;
        
        let len = (image.bytes_per_line * image.height) as usize;
        let data_slice = slice::from_raw_parts(image.data as *const u8, len);
        let data = Vec::from(data_slice);
        
        xlib::XDestroyImage(image_ptr);
        xlib::XCloseDisplay(display);
        xlib::XSetErrorHandler(old_error_handler);

        Ok(CaptureFrame {
            width: image.width as u32,
            height: image.height as u32,
            data,
        })
    }
}

pub fn cleanup_composite_redirect() {
    unsafe {
        if XCOMPOSITE_REDIRECT_ACTIVE.load(Ordering::SeqCst) {
            let display = xlib::XOpenDisplay(ptr::null());
            if !display.is_null() {
                let root = xlib::XDefaultRootWindow(display);
                eprintln!("Attempting XCompositeUnredirectWindow...");
                XCompositeUnredirectWindow(display, root, COMPOSITE_REDIRECT_AUTOMATIC);
                xlib::XSync(display, xlib::False);
                xlib::XCloseDisplay(display);
                XCOMPOSITE_REDIRECT_ACTIVE.store(false, Ordering::SeqCst);
                eprintln!("XCompositeUnredirectWindow successful.");
            }
        }
    }
}
