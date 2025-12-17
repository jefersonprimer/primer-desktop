import { invoke } from '@tauri-apps/api/core';

export class WhisperService {
  async startRecording(): Promise<void> {
    console.log('[WhisperService] Starting recording...');
    invoke('log_frontend_message', { message: `[WhisperService] startRecording called. Invoking backend command...` }).catch(console.error);
    await invoke('start_recording');
    invoke('log_frontend_message', { message: `[WhisperService] start_recording invoked successfully.` }).catch(console.error);
  }

  async getRecordingStatus(): Promise<boolean> {
      return await invoke<boolean>('get_recording_status');
  }

  async stopAndTranscribe(model: string = 'tiny'): Promise<string> {
    console.log('[WhisperService] Stopping recording...');
    // stop_recording now returns the file path (String)
    const audioPath = await invoke<string>('stop_recording');
    console.log(`[WhisperService] Audio saved to: ${audioPath}`);

    console.log(`[WhisperService] Transcribing with model: ${model}`);
    const text = await invoke<string>('transcribe_with_whisper', { audioPath, model });
    console.log(`[WhisperService] Transcription result: ${text}`);
    return text;
  }
}
