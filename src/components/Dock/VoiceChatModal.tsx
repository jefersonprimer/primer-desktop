import { useState, useEffect, useRef } from "react";
import { useAi } from "../../contexts/AiContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export default function VoiceChatModal({ isOpen, onClose, onSend }: Props) {
  const { 
    activeProvider, 
    transcriptionModel, 
    inputDeviceId,
    getApiKeyForProvider
  } = useAi();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null); 
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startRecording();
    } else {
      stopRecording();
      setTranscript("");
      setInterimTranscript("");
      setError(null);
    }
    return () => {
      stopRecording();
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript("");
      
      let stream: MediaStream;
      
      try {
        const constraints = {
          audio: {
            deviceId: inputDeviceId && inputDeviceId !== "default" ? { exact: inputDeviceId } : undefined
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        // Fallback: If specific device fails, try default
        if (inputDeviceId && inputDeviceId !== "default" && (err.name === "OverconstrainedError" || err.name === "NotFoundError")) {
           console.warn("Selected microphone failed, falling back to default.", err);
           try {
             stream = await navigator.mediaDevices.getUserMedia({ audio: true });
           } catch (retryErr) {
             throw retryErr;
           }
        } else {
           throw err;
        }
      }

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);

      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR'; 

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) setTranscript(prev => prev + " " + final);
          setInterimTranscript(interim);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Permissão de microfone negada. Verifique as configurações do sistema.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("Nenhum microfone encontrado.");
      } else {
          setError("Erro ao acessar microfone: " + (err.message || "Erro desconhecido"));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
        handleProcessing(audioBlob);
      };
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleProcessing = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
        const apiKey = getApiKeyForProvider(activeProvider);
        if (!apiKey) {
            throw new Error("Chave de API não encontrada para " + activeProvider);
        }

        let finalConfiguredText = "";

        if (activeProvider === "OpenAI") {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            // Map "GPT-4o Transcribe" to whisper-1 for now as it is the STT endpoint
            const modelToUse = transcriptionModel.includes("whisper") ? transcriptionModel : "whisper-1";
            formData.append("model", modelToUse); 

            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || "Erro na transcrição OpenAI");
            }

            const data = await response.json();
            finalConfiguredText = data.text;
        
        } else if (activeProvider === "Google") {
            // Convert blob to base64
            const reader = new FileReader();
            const base64Audio = await new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.readAsDataURL(audioBlob);
            });

            // Use the selected model or fallback
            // Note: gemini-live might not work with REST `generateContent`.
            // Fallback to gemini-1.5-flash if user selected a 'live' model that implies websocket
            // But let's try the selected one first.
            const modelToUse = transcriptionModel || "gemini-1.5-flash";

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            inline_data: {
                                mime_type: "audio/webm",
                                data: base64Audio
                            }
                        }, {
                            text: "Transcribe the audio to text strictly. Do not add descriptions."
                        }]
                    }]
                })
            });

            if (!response.ok) {
                 const err = await response.json();
                 throw new Error(err.error?.message || "Erro na transcrição Google");
            }

            const data = await response.json();
            finalConfiguredText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
             // Use the WebSpeech result if available?
             if (transcript) {
                 finalConfiguredText = transcript;
             } else {
                 throw new Error("Provedor não suportado para transcrição.");
             }
        }

        if (finalConfiguredText) {
            onSend(finalConfiguredText);
            onClose();
        } else {
            throw new Error("Nenhum texto transcrito.");
        }

    } catch (e: any) {
        console.error("Processing error", e);
        setError(e.message || "Erro ao processar áudio.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center pb-24 pointer-events-none ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
       {/* Background backdrop */}
       {isOpen && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onClose} />}

       {/* Modal Content */}
       <div className={`relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl pointer-events-auto transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-10'}`}>
          
          <div className="flex flex-col items-center gap-4">
             {/* Visualizer Placeholder */}
             <div className="flex items-center gap-1 h-12">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 bg-blue-500 rounded-full animate-pulse`} style={{ height: isRecording ? `${Math.random() * 24 + 12}px` : '4px', animationDelay: `${i * 0.1}s` }} />
                ))}
             </div>

             <h2 className="text-xl font-semibold text-white">
                {isProcessing ? "Processando..." : isRecording ? "Ouvindo..." : "Toque para falar"}
             </h2>

             {/* Transcript Area */}
             <div className="w-full min-h-[60px] max-h-[120px] overflow-y-auto text-center text-lg text-neutral-300">
                {transcript} <span className="text-neutral-500">{interimTranscript}</span>
             </div>

             {/* Controls */}
             <div className="flex gap-4 mt-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition"
                >
                    Cancelar
                </button>
                {isRecording ? (
                    <button 
                        onClick={stopRecording}
                        className="px-6 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                    >
                        Parar e Enviar
                    </button>
                ) : (
                   <button 
                        onClick={startRecording}
                        className="px-6 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                        Tentar Novamente
                    </button>
                )}
             </div>
             
             {error && <p className="text-red-400 text-sm">{error}</p>}

             <p className="text-xs text-neutral-500 mt-2">
                Usando: {transcriptionModel || "Modelo Padrão"} ({activeProvider})
             </p>
          </div>

       </div>
    </div>
  );
}
