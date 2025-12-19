import { shouldUseWhisper } from './platformDetector';
import { WhisperService } from './whisperService';
import { WebSpeechService } from './webSpeechService';
import { invoke } from '@tauri-apps/api/core';

export type SpeechMode = 'web_speech' | 'backend_recording';

export class UniversalSpeechService {
  private whisper = new WhisperService();
  private webSpeech = new WebSpeechService();
  private mode: SpeechMode = 'web_speech';

  constructor() {
     // Default based on platform, but can be overridden
     this.mode = shouldUseWhisper() ? 'backend_recording' : 'web_speech';
  }

  setMode(mode: SpeechMode) {
      this.mode = mode;
      invoke('log_frontend_message', { message: `[UniversalSpeechService] Mode set to: ${mode}` }).catch(console.error);
  }

  async startListening(
    onResult: (text: string) => void,
    onInterim?: (text: string) => void,
    onEnd?: () => void
  ): Promise<void> {
    invoke('log_frontend_message', { message: `[UniversalSpeechService] startListening called. Mode: ${this.mode}` }).catch(console.error);
    
    if (this.mode === 'backend_recording') {
      await this.whisper.startRecording();
    } else {
      this.webSpeech.startListening(onResult, onInterim, onEnd);
    }
  }

  async stopListening(): Promise<string | null> {
    if (this.mode === 'backend_recording') {
      // stop_recording now returns the file path (String)
      const audioPath = await invoke<string>('stop_recording');
      console.log(`[UniversalSpeechService] Recording stopped. Audio path: ${audioPath}`);
      return audioPath; 
    } else {
      this.webSpeech.stopListening();
      return null; // Results are handled via callbacks
    }
  }

  async getRecordingStatus(): Promise<boolean> {
      if (this.mode === 'backend_recording') {
          return await this.whisper.getRecordingStatus();
      }
      return false; 
  }
}
