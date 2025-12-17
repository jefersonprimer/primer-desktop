import { shouldUseWhisper } from './platformDetector';
import { WhisperService } from './whisperService';
import { WebSpeechService } from './webSpeechService';
import { invoke } from '@tauri-apps/api/core';

export class UniversalSpeechService {
  private whisper = new WhisperService();
  private webSpeech = new WebSpeechService();

  async startListening(
    onResult: (text: string) => void,
    onInterim?: (text: string) => void,
    onEnd?: () => void
  ): Promise<void> {
    invoke('log_frontend_message', { message: `[UniversalSpeechService] startListening called.` }).catch(console.error);
    if (shouldUseWhisper()) {
      invoke('log_frontend_message', { message: `[UniversalSpeechService] Using Whisper.` }).catch(console.error);
      // Whisper does not support streaming interim results in this implementation
      await this.whisper.startRecording();
    } else {
      invoke('log_frontend_message', { message: `[UniversalSpeechService] Using WebSpeech.` }).catch(console.error);
      this.webSpeech.startListening(onResult, onInterim, onEnd);
    }
  }

  async stopListening(): Promise<string | null> {
    if (shouldUseWhisper()) {
      // Get the model from local storage or default to tiny
      // In a real app, this should come from a store/context
      const model = localStorage.getItem('whisper_model') || 'tiny';
      
      try {
        const text = await this.whisper.stopAndTranscribe(model);
        return text;
      } catch (error) {
        console.error('[UniversalSpeechService] Whisper transcription failed:', error);
        throw error;
      }
    } else {
      this.webSpeech.stopListening();
      return null; // Results are handled via callbacks
    }
  }

  async getRecordingStatus(): Promise<boolean> {
      if (shouldUseWhisper()) {
          return await this.whisper.getRecordingStatus();
      }
      return false; // WebSpeech doesn't persist across reloads easily or expose this global state
  }
  
  isWhisper(): boolean {
      return shouldUseWhisper();
  }
}
