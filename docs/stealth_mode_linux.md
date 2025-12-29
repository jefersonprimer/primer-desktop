# Stealth Mode on Linux (X11)

This document details the implementation of "Stealth Mode" and related window management features for Linux (specifically X11) in the Primer application.

## Overview

Stealth Mode on Linux is designed to provide privacy, unobtrusiveness, and a "transparent" overlay experience. Due to the permissive nature of the X11 display server protocol, we can achieve deep system integration for features like click-through, taskbar hiding, and always-on-top behavior.

**Note:** These features are currently **exclusive to X11** and will not function as intended on Wayland sessions.

## Features & Implementation

The implementation interacts directly with the X11 server using the `x11` crate (bindings to Xlib/XShape) and `xcap` for screen capture.

### 1. Stealth Mode (Mirroring & Visibility)

Unlike macOS (which hides the window from capture) or Windows (which uses a specific API to exclude from capture), the Linux implementation adopts a "Realtime Mirror" approach while managing window state to appear "stealthy".

*   **Mechanism**:
    1.  Sets EWMH (Extended Window Manager Hints) atoms to hide the window from the environment.
    2.  Sets the window type to `_NET_WM_WINDOW_TYPE_DOCK` to resist "Show Desktop" actions (Super+D).
    3.  Starts a background thread using the `xcap` crate to capture the screen content and emit it to the frontend (`stealth-frame`), allowing the app to "see through" itself if needed or provide a specific overlay experience.
*   **Files**: `src-tauri/src/stealth/linux.rs`

### 2. Click-Through

Allows mouse clicks and events to pass through the application window to the windows behind it.

*   **Mechanism**: X Non-rectangular Window Shape Extension (XShape).
*   **API Used**: `XShapeCombineRectangles` (from `libXext`).
*   **Implementation**:
    *   **Enable**: Defines an "empty" region (0 rectangles) for the Input Shape (`ShapeInput`). This effectively removes the window's hit-test area, causing the X server to pass all input events to the window visually beneath it.
    *   **Disable**: Resets the input shape using `XShapeCombineMask` or by setting it back to the window's bounding box.
*   **File**: `src-tauri/src/clickthrough/linux.rs`

### 3. Hide from Taskbar and Pager (Alt+Tab)

Removes the application from the desktop taskbar and the Alt+Tab application switcher.

*   **Mechanism**: EWMH State Atoms.
*   **API Used**: `XChangeProperty` with `_NET_WM_STATE`.
*   **Implementation**:
    *   Adds `_NET_WM_STATE_SKIP_TASKBAR`: Hides from the taskbar/dock.
    *   Adds `_NET_WM_STATE_SKIP_PAGER`: Hides from the workspace switcher and often Alt+Tab.
*   **File**: `src-tauri/src/visibility/linux.rs`

### 4. Always On Top

Ensures the window stays above other standard windows.

*   **Mechanism**: EWMH State Atoms.
*   **API Used**: `XChangeProperty` with `_NET_WM_STATE`.
*   **Implementation**:
    *   Adds `_NET_WM_STATE_ABOVE`: Requests the window manager to keep this window above others.
    *   **Note**: The implementation also forces `_NET_WM_WINDOW_TYPE_DOCK` in `stealth/linux.rs` to ensure it stays visible even when "Show Desktop" is triggered, which is a common behavior for overlay tools.
*   **File**: `src-tauri/src/commands/window_commands.rs`, `src-tauri/src/stealth/linux.rs`

### 5. Window Opacity

Manages the global transparency of the window.

*   **Mechanism**: X11 Window Property.
*   **API Used**: `_NET_WM_WINDOW_OPACITY`.
*   **Implementation**:
    *   Sets the 32-bit Cardinal property `_NET_WM_WINDOW_OPACITY` on the window.
    *   Values range from 0 (transparent) to `0xFFFFFFFF` (opaque). The implementation handles the float-to-int conversion.
*   **File**: `src-tauri/src/commands/window_commands.rs`

## Dependencies

*   **Rust Crates**:
    *   `x11`: Raw FFI bindings to Xlib and extensions (XShape, XFixes).
    *   `xcap`: Cross-platform screen capture library (used for the mirroring component).
    *   `tauri`: For accessing the raw `XWindow` ID (`xid`).

## Why X11 Only? (Wayland Limitations)

The current implementation relies heavily on global state manipulation and input interception, which are core design anti-patterns in Wayland's security model.

1.  **Input Isolation (Click-Through)**: Wayland does not provide a standard protocol for a client to say "I am visible but ignore all input". Input routing is strictly controlled by the compositor. While the `shape` protocol exists, its support and behavior for input passthrough vary.
2.  **Global Positioning & Z-Order**: Wayland clients cannot position themselves globally (e.g., "move to x=0, y=0") or force themselves to be "Always on Top" without user interaction or specific shell protocols (like `wlr-layer-shell`, which is not supported by all compositors like GNOME).
3.  **Taskbar/Pager Hiding**: There is no universal way for a client to tell the compositor "don't show me in the taskbar".
4.  **Screen Capture**: Silent, background screen capture (used in the "Stealth Mirror") is restricted on Wayland. It typically requires using XDG Portals, which mandate a user confirmation dialog for every capture session, breaking the "stealth" and seamless UX.

To support Wayland in the future, the application would likely need to be rewritten as a shell extension or utilize specific protocols (like `gtk4-layer-shell`) with the understanding that it might only work on specific compositors (like wlroots-based ones or KDE) and not universally.
