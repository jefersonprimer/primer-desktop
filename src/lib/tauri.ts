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
  return await invoke('set_always_on_top', { enabled });
}

// Prompt Presets

export interface PromptPreset {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  is_built_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptPresetDto {
  name: string;
  description?: string;
  prompt: string;
}

export interface UpdatePromptPresetDto {
  id: string;
  name: string;
  description?: string;
  prompt: string;
}

export async function getPromptPresets(): Promise<PromptPreset[]> {
  return await invoke('get_prompt_presets');
}

export async function createPromptPreset(dto: CreatePromptPresetDto): Promise<PromptPreset> {
  return await invoke('create_prompt_preset', { dto });
}

export async function updatePromptPreset(dto: UpdatePromptPresetDto): Promise<PromptPreset> {
  return await invoke('update_prompt_preset', { dto });
}

export async function deletePromptPreset(id: string): Promise<void> {
  return await invoke('delete_prompt_preset', { id });
}