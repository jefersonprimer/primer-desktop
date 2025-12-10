#![cfg(target_os = "macos")]

use cocoa::appkit::{NSApp, NSApplication, NSApplicationActivationPolicy, NSWindow, NSWindowSharingType};
use cocoa::base::{id, nil, BOOL, YES, NO};
use cocoa::foundation::NSAutoreleasePool;
use objc::{msg_send, sel, sel_impl};
use tauri::{Manager, WebviewWindow};

#[cfg(target_os = "macos")]
use tauri::window::WindowExtMacOs;

const NS_WINDOW_SHARING_NONE: u64 = 0;
const NS_WINDOW_SHARING_READ_WRITE: u64 = 2;
const NS_MAIN_MENU_WINDOW_LEVEL: i32 = 24;
const NS_APPLICATION_ACTIVATION_POLICY_REGULAR: i32 = 0;
const NS_APPLICATION_ACTIVATION_POLICY_ACCESSORY: i32 = 1;

unsafe fn get_ns_window(window: &WebviewWindow) -> Option<id> {
    let ns_window = window.ns_window().ok()? as id;
    if ns_window == nil {
        return None;
    }
    Some(ns_window)
}

fn run_on_main_thread<F>(f: F)
where
    F: FnOnce() + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(move || {
        unsafe {
            let pool = NSAutoreleasePool::new(nil);
            f();
            let _: () = msg_send![pool, drain];
        }
    });
}

// Renamed to match the module's previous external API or adapted to new one.
// Previous API: enable_stealth_mode(window) -> Result<(), String>
// New API: set_stealth_mode(window, enabled) -> Result<(), String>

pub fn enable_stealth_mode(window: &WebviewWindow) -> Result<(), String> {
    set_stealth_mode(window, true)
}

pub fn disable_stealth_mode(window: &WebviewWindow) -> Result<(), String> {
    set_stealth_mode(window, false)
}

pub fn set_stealth_mode(window: &WebviewWindow, enabled: bool) -> Result<(), String> {
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    
    run_on_main_thread(move || unsafe {
        let sharing_type = if enabled { NS_WINDOW_SHARING_NONE } else { NS_WINDOW_SHARING_READ_WRITE };
        let _: () = msg_send![ns_window, setSharingType: sharing_type];
    });
    
    Ok(())
}

pub fn is_stealth_mode(window: &WebviewWindow) -> Result<bool, String> {
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    unsafe {
        let sharing_type: u64 = msg_send![ns_window, sharingType];
        Ok(sharing_type == NS_WINDOW_SHARING_NONE)
    }
}

pub fn set_click_through(window: &WebviewWindow, enabled: bool) -> Result<(), String> {
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    
    run_on_main_thread(move || unsafe {
        let value: BOOL = if enabled { YES } else { NO };
        let _: () = msg_send![ns_window, setIgnoresMouseEvents: value];
    });
    
    Ok(())
}

pub fn is_click_through(window: &WebviewWindow) -> Result<bool, String> {
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    unsafe {
        let ignores: BOOL = msg_send![ns_window, ignoresMouseEvents];
        Ok(ignores == YES)
    }
}

pub fn hide_from_dock() -> Result<(), String> {
    run_on_main_thread(|| unsafe {
        let app: id = NSApp();
        if app == nil {
            return;
        }
        let policy = NS_APPLICATION_ACTIVATION_POLICY_ACCESSORY;
        let _: BOOL = msg_send![app, setActivationPolicy: policy];
    });
    Ok(())
}

pub fn show_in_dock() -> Result<(), String> {
    run_on_main_thread(|| unsafe {
        let app: id = NSApp();
        if app == nil {
            return;
        }
        let policy = NS_APPLICATION_ACTIVATION_POLICY_REGULAR;
        let _: BOOL = msg_send![app, setActivationPolicy: policy];
    });
    Ok(())
}

pub fn is_hidden_from_dock() -> Result<bool, String> {
    unsafe {
        let app: id = NSApp();
        if app == nil {
            return Err("Failed to get NSApplication".to_string());
        }
        let policy: i32 = msg_send![app, activationPolicy];
        Ok(policy == NS_APPLICATION_ACTIVATION_POLICY_ACCESSORY)
    }
}

pub fn set_always_on_top(window: &WebviewWindow, enabled: bool) -> Result<(), String> {
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    
    run_on_main_thread(move || unsafe {
        let level = if enabled { NS_MAIN_MENU_WINDOW_LEVEL + 1 } else { 0 };
        let _: () = msg_send![ns_window, setLevel: level];
    });
    
    Ok(())
}

pub fn set_window_opacity(window: &WebviewWindow, opacity: f64) -> Result<(), String> {
    if !(0.0..=1.0).contains(&opacity) {
        return Err("Opacity must be between 0.0 and 1.0".to_string());
    }
    
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    
    run_on_main_thread(move || unsafe {
        let _: () = msg_send![ns_window, setAlphaValue: opacity];
        
        if opacity < 1.0 {
            let _: () = msg_send![ns_window, setOpaque: NO];
            let color: id = msg_send![class!(NSColor), clearColor];
            let _: () = msg_send![ns_window, setBackgroundColor: color];
        } else {
            let _: () = msg_send![ns_window, setOpaque: YES];
        }
    });
    
    Ok(())
}

pub fn get_window_opacity(window: &WebviewWindow) -> Result<f64, String> {
    let ns_window = unsafe { get_ns_window(window) }.ok_or("Failed to get NSWindow")?;
    unsafe {
        let opacity: f64 = msg_send![ns_window, alphaValue];
        Ok(opacity)
    }
}

pub fn enable_full_stealth(window: &WebviewWindow) -> Result<(), String> {
    set_stealth_mode(window, true)?;
    set_click_through(window, true)?;
    hide_from_dock()?;
    set_always_on_top(window, true)?;
    set_window_opacity(window, 0.8)?;
    Ok(())
}

pub fn disable_full_stealth(window: &WebviewWindow) -> Result<(), String> {
    set_stealth_mode(window, false)?;
    set_click_through(window, false)?;
    show_in_dock()?;
    set_always_on_top(window, false)?;
    set_window_opacity(window, 1.0)?;
    Ok(())
}

// Helper struct for status
pub struct StealthStatus {
    pub active: bool,
    pub method: crate::stealth::StealthMethod,
    pub click_through: bool,
    pub hidden_from_dock: bool,
    pub os: String,
}