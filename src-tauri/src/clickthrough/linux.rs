use tauri::{WebviewWindow, Runtime};
use x11::xlib::{Display, Window as XWindow, XOpenDisplay, XCloseDisplay, XFlush, XRectangle};
use std::ptr;
use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use std::os::raw::{c_int, c_ulong};

// Manually define XShape constants and functions since x11 crate feature is fighting us
const SHAPE_INPUT: c_int = 2;
const SHAPE_SET: c_int = 0;

#[link(name = "Xext")]
extern "C" {
    fn XShapeCombineRectangles(
        display: *mut Display,
        dest: XWindow,
        dest_kind: c_int,
        x_off: c_int,
        y_off: c_int,
        rectangles: *const XRectangle,
        n_rects: c_int,
        op: c_int,
        ordering: c_int,
    );
    
    // We might need XShapeCombineMask if we wanted to reset perfectly, but Rectangles with window size works for reset usually
    // or just passing 0 rects for "empty".
    
    // To reset (disable click-through), we usually set the shape to the window bounds.
    // Or simpler: XShapeCombineMask(dpy, win, ShapeInput, 0, 0, None, ShapeSet);
    fn XShapeCombineMask(
         display: *mut Display,
         dest: XWindow,
         dest_kind: c_int,
         x_off: c_int,
         y_off: c_int,
         src: c_ulong, // Pixmap (None is 0)
         op: c_int
    );
}

pub fn set_click_through<R: Runtime>(window: &WebviewWindow<R>, enable: bool) -> Result<(), String> {
    let xid = match window.window_handle().map_err(|e| e.to_string())?.as_raw() {
        RawWindowHandle::Xlib(h) => h.window,
        _ => return Err("Not running on X11.".to_string()),
    };

    unsafe {
        let display = XOpenDisplay(ptr::null());
        if display.is_null() {
            return Err("Failed to open X display".to_string());
        }

        if enable {
            // Set Input Shape to EMPTY (0 rects).
            // This makes the window transparent to input events.
            let rect = XRectangle {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
            
            XShapeCombineRectangles(
                display,
                xid,
                SHAPE_INPUT,
                0,
                0,
                &rect as *const _,
                0, // 0 rectangles = empty region
                SHAPE_SET,
                0,
            );
        } else {
            // Reset Input Shape to default (None mask = default/full window)
            XShapeCombineMask(
                display,
                xid,
                SHAPE_INPUT,
                0,
                0,
                0, // None
                SHAPE_SET
            );
        }

        XFlush(display);
        XCloseDisplay(display);
    }
    
    // Also emit event or log
    println!("Linux Click-Through set to: {}", enable);

    Ok(())
}
