# Linux Stealth & Mirror Implementation Details

This document outlines the implementation of "Stealth Mode" (invisibility to screen capture), "Click-through" behavior, and "Hide from Taskbar" features on Linux, specifically for the X11 display server.

## X11 (Standard)

On X11, we have direct access to the X server, allowing for granular control.

### Features
*   **Stealth Mode (Mirror):** The application captures the screen content (via `xcap`) and renders it, effectively creating a "transparent" window. 
    *   *Limitation:* True "invisibility" to other screen recorders requires the window to be unmapped or composited specially. Currently, we rely on the "Mirror" effect (showing what is behind the window) to simulate transparency.
*   **Click-Through:** Implemented using the **XFixes** and **Shape** extensions. We set the window's input region to be empty, allowing all mouse events to pass through to the windows below.
*   **Hide from Taskbar/Pager:** Implemented by manipulating `_NET_WM_STATE` atoms (`_NET_WM_STATE_SKIP_TASKBAR`, `_NET_WM_STATE_SKIP_PAGER`). This works on most compliant Window Managers (GNOME, KDE, i3, etc.).

### Implementation
See `src-tauri/src/stealth/linux.rs`.

## Troubleshooting

If features fail:
1.  **Check Display Server:** Ensure you are running on X11. The application logs "Detected Display Server: X11" on startup.