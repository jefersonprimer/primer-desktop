import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

export interface StealthStatus {
  stealth_mode: boolean;
  click_through: boolean;
  hidden_from_dock: boolean;
  opacity: number;
}

export async function setStealthMode(enabled: boolean): Promise<void> {
  const window = getCurrentWindow();
  await invoke('set_stealth_mode', { window, enabled });
}

export async function isStealthMode(): Promise<boolean> {
  const window = getCurrentWindow();
  return await invoke('is_stealth_mode', { window });
}

export async function setClickThrough(enabled: boolean): Promise<void> {
  const window = getCurrentWindow();
  await invoke('set_click_through', { window, enabled });
}

export async function hideFromDock(): Promise<void> {
  await invoke('hide_from_dock');
}

export async function showInDock(): Promise<void> {
  await invoke('show_in_dock');
}

export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  const window = getCurrentWindow();
  await invoke('set_always_on_top', { window, enabled });
}

export async function setWindowOpacity(opacity: number): Promise<void> {
  const window = getCurrentWindow();
  await invoke('set_window_opacity', { window, opacity });
}

export async function enableFullStealth(): Promise<void> {
  const window = getCurrentWindow();
  await invoke('enable_full_stealth', { window });
}

export async function disableFullStealth(): Promise<void> {
  const window = getCurrentWindow();
  await invoke('disable_full_stealth', { window });
}

export async function getStealthStatus(): Promise<StealthStatus> {
  const window = getCurrentWindow();
  return await invoke('get_stealth_status', { window });
}
