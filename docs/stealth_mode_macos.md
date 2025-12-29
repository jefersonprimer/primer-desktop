# Stealth Mode on macOS

This document details the implementation of "Stealth Mode" and related window management features for macOS in the Primer application.

## Overview

Stealth Mode enables the application to become unobtrusive, non-interactive (click-through), and invisible to screen capture tools. This is particularly useful for overlay applications that need to remain visible to the user without interfering with their workflow or being recorded.

## Features & Implementation

The implementation relies on direct interaction with macOS Cocoa APIs using the `cocoa` and `objc` Rust crates. The core logic is located in `src-tauri/src/stealth/macos.rs`.

### 1. Stealth Mode (Capture Protection)

Prevents the window from being captured by screenshots, screen recordings, or screen sharing.

*   **Mechanism**: Modifies the `NSWindowSharingType` of the window.
*   **API Used**: `[ns_window setSharingType: NSWindowSharingNone]`
*   **Implementation**:
    *   `NS_WINDOW_SHARING_NONE` (0): The window is not shared with other applications (invisible to capture).
    *   `NS_WINDOW_SHARING_READ_WRITE` (2): Default behavior, visible to capture.

### 2. Click-Through

Allows mouse clicks and events to pass through the application window to the windows behind it.

*   **Mechanism**: Sets the `ignoresMouseEvents` property of the `NSWindow`.
*   **API Used**: `[ns_window setIgnoresMouseEvents: YES]`
*   **Implementation**:
    *   `YES`: The window ignores mouse events.
    *   `NO`: The window receives mouse events.

### 3. Hide from Dock and App Switcher (Cmd+Tab)

Controls the application's visibility in the macOS Dock and the Command+Tab application switcher.

*   **Mechanism**: Changes the `NSApplicationActivationPolicy`.
*   **API Used**: `[NSApp setActivationPolicy: policy]`
*   **Implementation**:
    *   `NS_APPLICATION_ACTIVATION_POLICY_ACCESSORY` (1): The application does not appear in the Dock and does not have a menu bar, but can display windows.
    *   `NS_APPLICATION_ACTIVATION_POLICY_REGULAR` (0): The application appears in the Dock and has a menu bar.

### 4. Always On Top

Ensures the window stays above other standard windows.

*   **Mechanism**: Adjusts the window level.
*   **API Used**: `[ns_window setLevel: level]`
*   **Implementation**:
    *   Enabled: `NS_MAIN_MENU_WINDOW_LEVEL + 1` (25). This places it above the main menu bar.
    *   Disabled: `NSNormalWindowLevel` (0).

### 5. Transparency & Visuals

Manages window opacity and background transparency.

*   **Mechanism**: Adjusts alpha value and opaque property.
*   **API Used**:
    *   `[ns_window setAlphaValue: opacity]`
    *   `[ns_window setOpaque: NO]` (if opacity < 1.0)
    *   `[ns_window setBackgroundColor: [NSColor clearColor]]`

## Dependencies

*   **Rust Crates**:
    *   `cocoa`: Bindings to Cocoa framework.
    *   `objc`: Interface to the Objective-C runtime.
    *   `tauri`: For window management and accessing the underlying `NSWindow`.

## File Structure

*   `src-tauri/src/stealth/macos.rs`: Core implementation of all macOS-specific stealth features.
*   `src-tauri/src/clickthrough/macos.rs`: Wrapper for click-through functionality.
*   `src-tauri/src/visibility/macos.rs`: Wrapper for Dock/Taskbar visibility.
