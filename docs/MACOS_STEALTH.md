# 🍎 macOS Stealth Implementation

This document details the implementation of the Stealth Mode for macOS in the Primer application.

## 🎯 Overview

The macOS implementation provides a "Full Stealth" capability that makes the application:
1.  **Invisible to Screen Capture:** Tools like Zoom, OBS, and Teams cannot see the window.
2.  **Click-Through:** Mouse events pass through the window to applications behind it.
3.  **Hidden from System UI:** The app is removed from the Dock and the Command+Tab switcher.
4.  **Ghostly Appearance:** The window becomes semi-transparent (80% opacity) and stays always-on-top.

## 🛠 Technical Architecture

The core logic resides in `src-tauri/src/stealth/macos.rs` and utilizes native Cocoa and Objective-C runtimes via FFI (Foreign Function Interface).

### Key Components

#### 1. Thread Safety (`run_on_main_thread`)
MacOS UI operations **must** run on the main thread. We implemented a helper function using `dispatch_async` (simulated via `spawn_blocking` and `NSAutoreleasePool` on the main loop) to safely execute Objective-C code without crashing the application.

```rust
fn run_on_main_thread<F>(f: F) { ... }
```

#### 2. Screen Capture Protection (`NSWindowSharingType`)
We use the private `NSWindowSharingType` API to prevent the window frame from being captured by the Window Server.

*   **Enabled:** `NSWindowSharingNone` (0) - The window is not shared with the window server's capture buffer.
*   **Disabled:** `NSWindowSharingReadOnly` (2) - Standard behavior.

#### 3. Click-Through (`ignoresMouseEvents`)
We manipulate the `NSWindow` property to ignore mouse events.

```rust
msg_send![ns_window, setIgnoresMouseEvents: YES];
```

#### 4. Dock & Task Switcher (`NSApplicationActivationPolicy`)
We change the application's activation policy at runtime.

*   **Hidden:** `NSApplicationActivationPolicyAccessory` - App runs but doesn't appear in the Dock or force menu bar changes.
*   **Visible:** `NSApplicationActivationPolicyRegular` - Standard app behavior.

#### 5. Window Level & Opacity
*   **Always on Top:** Sets the window level to `NSMainMenuWindowLevel + 1`.
*   **Opacity:** Adjusts `alphaValue` to 0.8 and ensures `opaque` is NO to handle transparency correctly.

## 📦 File Structure

*   `src-tauri/src/stealth/macos.rs`: Core implementation.
*   `src-tauri/src/visibility/macos.rs`: Helper for Dock visibility.
*   `src-tauri/src/clickthrough/macos.rs`: Helper for mouse events.
*   `src-tauri/src/commands/window_commands.rs`: Exposes `enable_full_stealth` to the frontend.

## 🚀 Usage

### Frontend (React)
```typescript
import { enableFullStealth, disableFullStealth } from '../stealth';

// Turn on ghost mode
await enableFullStealth();
```

### Hotkey
*   **Command + Shift + S**: Toggles Full Stealth mode globally.
