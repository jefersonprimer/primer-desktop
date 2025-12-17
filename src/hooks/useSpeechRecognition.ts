import { useState, useRef, useCallback, useEffect } from 'react';
import { UniversalSpeechService } from '../services/speech/universalSpeechService';
import { invoke } from '@tauri-apps/api/core';

export interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  transcribe?: (audioBase64: string) => Promise<string>;
}

export function useSpeechRecognition({ onResult, onEnd }: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const serviceRef = useRef<UniversalSpeechService | null>(null);

  useEffect(() => {
    serviceRef.current = new UniversalSpeechService();

    // Check if already recording (for Whisper/Backend persistence)
    const checkStatus = async () => {
        if (serviceRef.current?.isWhisper()) {
            try {
                const recording = await serviceRef.current.getRecordingStatus();
                console.log("[useSpeechRecognition] Initial recording status:", recording);
                if (recording) {
                    setIsListening(true);
                }
            } catch (e) {
                console.error("[useSpeechRecognition] Failed to check recording status", e);
            }
        }
    };
    checkStatus();
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setTranscript('');
    setError(null);
    setIsListening(true);

    try {
        await serviceRef.current?.startListening(
            (text) => {
                setTranscript(text);
                if (onResult) onResult(text);
            },
            () => { // onInterim
                // This callback is currently not exposing interim results to the hook's state.
                // If needed, an `interimTranscript` state could be added to the hook.
            },
            () => { // onEnd (from WebSpeech)
                setIsListening(false);
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
  }, [isListening, onResult, onEnd]);

  const stopListening = useCallback(async () => {
    if (!isListening) return;

    try {
        const result = await serviceRef.current?.stopListening();
        
        setIsListening(false);
        
        if (result) {
            // Whisper returned the full text
            setTranscript(result);
            if (onResult) onResult(result);
            if (onEnd) onEnd();
        }
    } catch (e: any) {
        console.error("Failed to stop listening/transcribe:", e);
        setError(e.message || "Failed to stop listening");
        setIsListening(false);
    }
  }, [isListening, onResult, onEnd]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening
  };
}
