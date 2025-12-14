import { invoke } from '@tauri-apps/api/core';

export interface StealthStatus {
  active: boolean;
  method: 'NativeAPI' | 'RealtimeMirror';
  click_through: boolean;
  hidden_from_dock: boolean;
  os: string;
}

export async function enableStealthMode(): Promise<StealthStatus> {
  return await invoke('enable_stealth_mode_cmd');
}

export async function disableStealthMode(): Promise<void> {
  return await invoke('disable_stealth_mode_cmd');
}

export async function getStealthStatus(): Promise<StealthStatus> {
  return await invoke('get_stealth_status_cmd');
}

export async function enableClickThrough(): Promise<void> {
  return await invoke('enable_click_through_cmd');
}

export async function disableClickThrough(): Promise<void> {
  return await invoke('disable_click_through_cmd');
}

export async function hideFromTaskbar(): Promise<void> {
  return await invoke('hide_from_taskbar_cmd');
}

export async function showInTaskbar(): Promise<void> {
  return await invoke('show_in_taskbar_cmd');
}

export interface AppConfig {
  language: string;
}

export async function getAppConfig(): Promise<AppConfig> {
  return await invoke('get_app_config');
}

export async function setAppLanguage(language: string): Promise<void> {
  return await invoke('set_language', { language });
}

export async function openLogFolder(): Promise<void> {
  return await invoke('open_log_folder');
}

export async function readLogContent(): Promise<string> {
  return await invoke('read_log_content');
}

export async function getLogPath(): Promise<string> {
  return await invoke('get_log_path_cmd');
}

export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  // Pass the current window automatically on backend if handled, or pass explicitly if needed.
  // The backend command `set_always_on_top` expects `window: WebviewWindow`.
  // When invoking from frontend, the tauri backend automatically injects the calling window if we don't provide it, 
  // BUT only if the command signature uses it as the first argument and we don't pass it?
  // Actually, usually we don't need to pass 'window' from frontend invoke if backend uses `Window` type.
  // However, `set_always_on_top` in `window_commands.rs` takes `window: WebviewWindow`.
  // Let's assume standard Tauri injection.
  return await invoke('set_always_on_top', { enabled });
}
