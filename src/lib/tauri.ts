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
