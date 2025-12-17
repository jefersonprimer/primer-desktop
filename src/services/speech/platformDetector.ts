import { platform, type Platform } from '@tauri-apps/plugin-os';
import { invoke } from '@tauri-apps/api/core';

let cachedPlatform: Platform | null = null;

export function getPlatform(): Platform {
  if (cachedPlatform) return cachedPlatform;
  cachedPlatform = platform();
  invoke('log_frontend_message', { message: `[PlatformDetector] Detected platform: ${cachedPlatform}` }).catch(console.error);
  return cachedPlatform;
}

export function shouldUseWhisper(): boolean {
  const os = getPlatform();
  const useWhisper = os === 'linux';
  invoke('log_frontend_message', { message: `[PlatformDetector] shouldUseWhisper: ${useWhisper} (OS: ${os})` }).catch(console.error);
  return useWhisper;
}
