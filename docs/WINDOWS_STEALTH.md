# 🪟 Windows Stealth Implementation

This document details the implementation of the Stealth Mode for Windows in the Primer application.

## 🎯 Overview

The Windows implementation provides a "Desktop Mirror" capability combined with native window affinity settings to ensure:
1.  **Invisible to Screen Capture:** Zoom, OBS, and Teams see the desktop *behind* the app, or a clean desktop feed.
2.  **Click-Through:** Mouse clicks pass through to underlying windows.
3.  **Hidden from Taskbar:** The application icon is removed from the taskbar.

## 🛠 Technical Architecture

The implementation uses the **Windows Graphics Capture API** (Windows 10 1803+) and **Direct3D 11** to create a sophisticated stealth mechanism.

### Key Components

#### 1. Capture Exclusion (`SetWindowDisplayAffinity`)
The primary line of defense. We set a specific flag on the main window that tells the Desktop Window Manager (DWM) to exclude this window from any capture operations.

```rust
SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
```
*   **Effect:** The window is drawn on the screen for the user, but in any screen sharing or recording, it appears transparent/invisible.

#### 2. Desktop Mirroring (Fallback & Consistency)
To ensure perfect "invisibility" even in full-screen sharing scenarios, we implement a Desktop Mirror:
*   **Graphics Capture:** We capture the entire desktop using `Windows.Graphics.Capture`.
*   **Filtering:** We capture the desktop *as if our window didn't exist* (implicitly handled by the Affinity setting).
*   **Fake Window:** We create an invisible, layered window ("Stealth Mirror") that can serve as a target for debug or complex composition if needed in the future.

#### 3. Click-Through (`WS_EX_TRANSPARENT`)
We modify the extended window styles (`GWL_EXSTYLE`) to include `WS_EX_TRANSPARENT` and `WS_EX_LAYERED`. This tells Windows to hit-test *through* the window.

#### 4. Taskbar Visibility (`WS_EX_TOOLWINDOW`)
To hide from the taskbar, we toggle the window style from `WS_EX_APPWINDOW` (standard app) to `WS_EX_TOOLWINDOW` (floating tool palette), which natively hides it from the taskbar.

## 📦 File Structure

*   `src-tauri/src/stealth/windows/`:
    *   `manager.rs`: Orchestrates the capture loop and affinity settings.
    *   `capture.rs`: Handles the `Windows.Graphics.Capture` session.
    *   `renderer.rs`: Direct3D 11 logic to process frames.
    *   `fake_window.rs`: Manages the hidden mirror window.
*   `src-tauri/src/clickthrough/windows.rs`: Handles mouse event passthrough.
*   `src-tauri/src/visibility/windows.rs`: Handles taskbar visibility.

## 🚀 Usage

### Frontend (React)
```typescript
import { enableFullStealth, disableFullStealth } from '../stealth';

// Turn on stealth mode
await enableFullStealth();
```

### Hotkey
*   **Ctrl + Shift + S**: Toggles Full Stealth mode globally.

## ⚠️ Requirements
*   Windows 10 Version 1803 (April 2018 Update) or newer.
*   GPU with Direct3D 11 support.
