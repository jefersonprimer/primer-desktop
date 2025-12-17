export class WebSpeechService {
    private recognition: any = null;
    private onResultCallback: ((text: string) => void) | null = null;
    private onInterimCallback: ((text: string) => void) | null = null;
    private onEndCallback: (() => void) | null = null;
    private isListening = false;
  
    constructor() {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'pt-BR'; // Default to pt-BR as requested
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
  
        this.recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
  
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
  
          if (finalTranscript && this.onResultCallback) {
            this.onResultCallback(finalTranscript);
          }
          
          if (this.onInterimCallback) {
            this.onInterimCallback(interimTranscript);
          }
        };
  
        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        };
  
        this.recognition.onerror = (event: any) => {
          console.error('[WebSpeechService] Error:', event.error);
          this.isListening = false;
        };
      } else {
        console.warn('[WebSpeechService] API not supported in this browser/webview');
      }
    }
  
    startListening(
      onResult: (text: string) => void,
      onInterim?: (text: string) => void,
      onEnd?: () => void
    ): void {
      if (!this.recognition) return;
      if (this.isListening) return;
  
      this.onResultCallback = onResult;
      this.onInterimCallback = onInterim || null;
      this.onEndCallback = onEnd || null;
  
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.error('[WebSpeechService] Failed to start:', e);
      }
    }
  
    stopListening(): void {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
        this.isListening = false;
      }
    }
  }
  