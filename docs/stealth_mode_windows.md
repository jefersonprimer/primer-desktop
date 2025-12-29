# Stealth Mode on Windows

This document details the implementation of "Stealth Mode" and related window management features for Windows in the Primer application.

## Overview

Stealth Mode on Windows is designed to provide privacy and unobtrusiveness. It combines standard Windows APIs to prevent screen capture, manage input pass-through (click-through), and control visibility in system shell elements like the Taskbar and Alt+Tab switcher.

## Features & Implementation

The implementation interacts directly with the Windows API (Win32) using the `windows` crate.

### 1. Stealth Mode (Capture Protection)

Prevents the window from appearing in screenshots, screen recordings, or screen sharing sessions.

*   **Mechanism**: Sets the window's display affinity to exclude it from capture.
*   **API Used**: `SetWindowDisplayAffinity`
*   **Implementation**:
    *   `WDA_EXCLUDEFROMCAPTURE` (0x00000011): The window is displayed on the monitor but is invisible to capture. It will appear as transparent or black in recordings.
    *   `WDA_NONE` (0x00000000): Default behavior, visible to capture.
*   **File**: `src-tauri/src/stealth/windows/manager.rs`

### 2. Click-Through

Allows mouse clicks and events to pass through the application window to the windows behind it, making the application non-interactive.

*   **Mechanism**: Modifies the Extended Window Styles (`GWL_EXSTYLE`).
*   **API Used**: `GetWindowLongPtrW`, `SetWindowLongPtrW`
*   **Implementation**:
    *   **Enable**: Adds `WS_EX_TRANSPARENT` and `WS_EX_LAYERED`.
        *   `WS_EX_TRANSPARENT`: The window should not be painted until siblings beneath the window (created by the same thread) have been painted. More importantly for input, hit testing passes through a transparent window.
        *   `WS_EX_LAYERED`: Required for transparency effects and often used in conjunction with click-through.
    *   **Disable**: Removes `WS_EX_TRANSPARENT`.
*   **File**: `src-tauri/src/clickthrough/windows.rs`

### 3. Hide from Taskbar and Alt+Tab

Removes the application from the Windows Taskbar and the Alt+Tab application switcher.

*   **Mechanism**: Modifies the Extended Window Styles (`GWL_EXSTYLE`).
*   **API Used**: `GetWindowLongPtrW`, `SetWindowLongPtrW`
*   **Implementation**:
    *   **Hide**: 
        1.  Removes `WS_EX_APPWINDOW`: Prevents the window from being forced onto the taskbar.
        2.  Adds `WS_EX_TOOLWINDOW`: Creates a tool window (floating toolbar) which is intended to not appear in the taskbar or Alt+Tab.
    *   **Show**:
        1.  Removes `WS_EX_TOOLWINDOW`.
        2.  Adds `WS_EX_APPWINDOW`.
*   **File**: `src-tauri/src/visibility/windows.rs`

### 4. Always On Top

Ensures the window stays above other non-topmost windows.

*   **Mechanism**: Changes the window's Z-order.
*   **API Used**: `SetWindowPos`
*   **Implementation**:
    *   **Enable**: call with `HWND_TOPMOST`.
    *   **Disable**: call with `HWND_NOTOPMOST`.
    *   Flags: `SWP_NOMOVE | SWP_NOSIZE` are used to retain the current position and size.
*   **File**: `src-tauri/src/commands/window_commands.rs`

### 5. Transparency & Opacity

Manages the global opacity of the window.

*   **Mechanism**: Uses Layered Window attributes.
*   **API Used**: `SetLayeredWindowAttributes`
*   **Implementation**:
    *   Ensures `WS_EX_LAYERED` style is set.
    *   Sets `LWA_ALPHA` with a value between 0 (fully transparent) and 255 (fully opaque).
*   **File**: `src-tauri/src/commands/window_commands.rs`

## Dependencies

*   **Rust Crates**:
    *   `windows`: The official Rust bindings for the Windows API. Key modules used include:
        *   `Win32::UI::WindowsAndMessaging` (for window styles, positioning, and display affinity)
        *   `Win32::Foundation` (for basic types like `HWND`, `BOOL`)
    *   `tauri`: For accessing the underlying `HWND` via `window_handle()`.

## File Structure

*   `src-tauri/src/stealth/windows/manager.rs`: Handles the core capture protection (`SetWindowDisplayAffinity`) and potentially advanced rendering logic.
*   `src-tauri/src/clickthrough/windows.rs`: Manages mouse event transparency (`WS_EX_TRANSPARENT`).
*   `src-tauri/src/visibility/windows.rs`: Manages visibility in shell elements (`WS_EX_TOOLWINDOW`).
*   `src-tauri/src/commands/window_commands.rs`: Handles generic window properties like "Always on Top" and Opacity for Windows.
