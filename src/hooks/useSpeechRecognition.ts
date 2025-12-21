import { useState, useRef, useCallback, useEffect } from 'react';
import { UniversalSpeechService } from '../services/speech/universalSpeechService';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAi } from '../contexts/AiContext';
import { useNotification } from '../contexts/NotificationContext';
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
  const { addNotification } = useNotification();

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
        handleBackendStop();
    });

    return () => {
        unlistenSilence.then(f => f());
    };
  }, []);

  const handleBackendStop = async () => {
      try {
          // Logic to handle backend stop if needed
      } catch(e) {
          console.error(e);
      }
  };

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
                     addNotification({
                         message: "No API Key found for transcription",
                         type: 'error',
                         duration: 4000
                     });
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
        addNotification({
            message: `Error stopping listener: ${e.message}`,
            type: 'error'
        });
    }
  }, [isListening, onResult, onEnd, activeProvider, transcriptionModel, getApiKeyForProvider, addNotification]);

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

    // Permission Check Logic
    if (transcriptionModel === 'web_speech_api') {
        try {
            // @ts-ignore - navigator.permissions might vary in TS definitions
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            if (permissionStatus.state === 'prompt') {
                addNotification({
                    title: 'Microphone Access',
                    message: 'Please allow microphone access when prompted by the browser.',
                    type: 'info',
                    duration: 5000,
                });
            } else if (permissionStatus.state === 'denied') {
                addNotification({
                    title: 'Microphone Blocked',
                    message: 'Microphone access is denied by the browser.',
                    type: 'error',
                    duration: 10000,
                    actions: [
                        {
                            label: 'Open Settings',
                            onClick: () => invoke('open_system_settings', { settingType: 'microphone' }),
                            variant: 'primary'
                        }
                    ]
                });
                return; // Don't even try if we know it's denied
            }
        } catch (e) {
            // Permission API not supported or failed, proceed anyway
        }
    } else {
        // Backend/Native recording
        const hasUsedMic = localStorage.getItem('has_used_mic_backend');
        if (!hasUsedMic) {
             addNotification({
                title: 'Permission Required',
                message: 'PrimerAI needs access to your microphone.',
                type: 'info',
                duration: 10000,
                actions: [
                    {
                        label: 'Open Settings',
                        onClick: () => invoke('open_system_settings', { settingType: 'microphone' }),
                        variant: 'primary'
                    },
                    {
                         label: 'Continue',
                         onClick: () => { /* Just dismiss */ },
                         variant: 'secondary'
                    }
                ]
            });
            localStorage.setItem('has_used_mic_backend', 'true');
        }
    }

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
             addNotification({
                title: 'Recording Error',
                message: e.message || "Failed to start listening",
                type: 'error',
                actions: [
                    {
                        label: 'Open Settings',
                        onClick: () => invoke('open_system_settings', { settingType: 'microphone' }),
                        variant: 'primary'
                    }
                ]
            });
        }
    }
  }, [isListening, onResult, onEnd, transcriptionModel, addNotification]);

  return {
    isListening,
    transcript: (transcript + ' ' + interimTranscript).trim(),
    error,
    startListening,
    stopListening
  };
}
