import { useState, useRef, useCallback, useEffect } from 'react';
import { UniversalSpeechService } from '../services/speech/universalSpeechService';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAi } from '../contexts/AiContext';
import { transcribeAudio } from '../services/aiService';

export interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
}

export function useSpeechRecognition({ onResult, onEnd }: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const fullTranscriptRef = useRef('');
  const serviceRef = useRef<UniversalSpeechService | null>(null);

  const { activeProvider, transcriptionModel, getApiKeyForProvider } = useAi();

  useEffect(() => {
    serviceRef.current = new UniversalSpeechService();

    // Check if already recording (for Whisper/Backend persistence)
    const checkStatus = async () => {
        try {
            const recording = await invoke<boolean>('get_recording_status');
            console.log("[useSpeechRecognition] Initial recording status:", recording);
            if (recording) {
                // If recording, assume backend mode.
                serviceRef.current?.setMode('backend_recording');
                setIsListening(true);
            }
        } catch (e) {
            console.error("[useSpeechRecognition] Failed to check recording status", e);
        }
    };
    checkStatus();

    // Listen for silence detection from backend
    const unlistenSilence = listen("recording_silence_detected", () => {
        console.log("[useSpeechRecognition] Silence detected by backend. Stopping.");
        // We need to trigger the stop flow.
        // Since the backend already stopped the recording loop (IS_RECORDING = false),
        // calling stop_recording cmd will just return the file path.
        // However, we need to update React state.
        
        // We can't directly call 'stopListening' from here easily because it's a callback created in render.
        // But we can use a ref or just trigger it via a state effect?
        // Better: trigger a function that does the same logic as stopListening.
        handleBackendStop();
    });

    return () => {
        unlistenSilence.then(f => f());
    };
  }, []);

  const handleBackendStop = async () => {
      // Logic duplicated from stopListening, but knowing backend is already stopped.
      try {
          // 'stop_recording' returns the path if it was recording, or error.
          // Since the backend set IS_RECORDING to false *before* emitting,
          // calling 'stop_recording' might fail with "Not recording" IF we implemented it strictly.
          // BUT: audio_commands.rs 'stop_recording' checks IS_RECORDING.
          // Wait, if backend sets IS_RECORDING=false, then 'stop_recording' command will return error "Not recording".
          // We need to fix audio_commands.rs or change how we get the file path.
          // Actually, let's assume 'stop_recording' just returns the path of the *last* recording if not recording?
          // No, currently it returns Err("Not recording").
          
          // FIX: We need 'stop_recording' to be callable even if it just finished?
          // OR: the event should send the path?
          // Let's modify audio_commands.rs to return path even if stopped? 
          // OR: Just assume the file is at the temp path.
          
          // Let's try to call stopListening.
          // But wait, stopListening calls serviceRef.current.stopListening().
          // Service calls invoke('stop_recording').
          
          // I need to update audio_commands.rs first to ensure 'stop_recording' returns the file path even if IS_RECORDING became false automatically.
      } catch(e) {
          console.error(e);
      }
  };

  // Re-define stopListening to handle the flow
  const log = async (msg: string) => {
      try { await invoke('log_frontend_message', { message: msg }); } catch (e) { console.log(msg); }
  };

  const stopListening = useCallback(async () => {
    log(`[useSpeechRecognition] stopListening called. isListening: ${isListening}`);
    if (!isListening) {
         log("[useSpeechRecognition] Already stopped listening (state check).");
         return;
    }

    try {
        log("[useSpeechRecognition] Invoking service stopListening...");
        const result = await serviceRef.current?.stopListening();
        log(`[useSpeechRecognition] Service result: ${result}`);
        
        setIsListening(false);
        setInterimTranscript('');
        
        if (result && typeof result === 'string') {
            const audioPath = result;
            log(`[useSpeechRecognition] Audio path received: ${audioPath}`);
            let finalMetadata = "";

            if (transcriptionModel === 'whisper_cpp' || activeProvider === "OpenRouter") {
                 log("[useSpeechRecognition] Using Whisper CPP local.");
                 const whisperModelName = localStorage.getItem("whisper_model") || "tiny";
                 log(`[useSpeechRecognition] Invoking transcribe_with_whisper with model ${whisperModelName}...`);
                 finalMetadata = await invoke<string>('transcribe_with_whisper', { audioPath, model: whisperModelName });
                 log(`[useSpeechRecognition] Whisper returned length: ${finalMetadata.length}`);
            } else {
                 log(`[useSpeechRecognition] Using Cloud API: ${activeProvider}`);
                 const apiKey = getApiKeyForProvider(activeProvider);
                 if (!apiKey) {
                     log("No API Key found for transcription");
                 } else {
                     log("[useSpeechRecognition] Reading audio file...");
                     const audioBase64 = await invoke<string>('read_audio_file', { path: audioPath });
                     log("[useSpeechRecognition] Transcribing via API...");
                     finalMetadata = await transcribeAudio(audioBase64, activeProvider, transcriptionModel, apiKey);
                 }
            }
            
            log(`[useSpeechRecognition] Transcription result: ${finalMetadata}`);
            if (finalMetadata) {
                fullTranscriptRef.current = finalMetadata;
                setTranscript(finalMetadata);
                if (onResult) {
                    log("[useSpeechRecognition] Calling onResult...");
                    onResult(finalMetadata);
                }
                if (onEnd) onEnd();
            }
        } else {
            log("[useSpeechRecognition] No result or result not string (WebSpeech?)");
        }
    } catch (e: any) {
        log(`[useSpeechRecognition] ERROR: ${e.message || e}`);
        setError(e.message || "Failed to stop listening");
        setIsListening(false);
    }
  }, [isListening, onResult, onEnd, activeProvider, transcriptionModel, getApiKeyForProvider]);

  // Use an effect to trigger stopListening when the event fires
  useEffect(() => {
      const unlistenSilence = listen("recording_silence_detected", () => {
          console.log("[useSpeechRecognition] Silence detected. Triggering stop.");
          stopListening();
      });

      return () => {
          unlistenSilence.then(f => f());
      };
  }, [stopListening]);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setTranscript('');
    fullTranscriptRef.current = '';
    setInterimTranscript('');
    setError(null);
    setIsListening(true);

    try {
        const mode = transcriptionModel === 'web_speech_api' ? 'web_speech' : 'backend_recording';
        serviceRef.current?.setMode(mode);

        await serviceRef.current?.startListening(
            (text) => {
                fullTranscriptRef.current = (fullTranscriptRef.current + ' ' + text).trim();
                setTranscript(fullTranscriptRef.current);
                setInterimTranscript('');
                if (onResult) onResult(fullTranscriptRef.current);
            },
            (interimText) => {
                setInterimTranscript(interimText);
            },
            () => { // onEnd (from WebSpeech)
                setIsListening(false);
                setInterimTranscript('');
                if (onEnd) onEnd();
            }
        );
    } catch (e: any) {
        console.error("Failed to start listening:", e);
        invoke('log_frontend_message', { message: `[useSpeechRecognition] Error starting listening: ${e.message || e}` }).catch(console.error);
        if (e.toString().includes("Already recording") || (e.message && e.message.includes("Already recording"))) {
            console.log("Backend says already recording. Syncing state to true.");
            setIsListening(true);
        } else {
            setError(e.message || "Failed to start listening");
            setIsListening(false);
        }
    }
  }, [isListening, onResult, onEnd, transcriptionModel]);

  return {
    isListening,
    transcript: (transcript + ' ' + interimTranscript).trim(),
    error,
    startListening,
    stopListening
  };
}
