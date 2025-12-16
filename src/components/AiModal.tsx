import { useRef, useEffect, useState } from "react";
import Draggable from "react-draggable";
import SettingsIcon from "./ui/icons/SettingsIcon";
import { invoke } from "@tauri-apps/api/core";
import ZapIcon from "./ui/icons/ZapIcon";
import CheckIcon from "./ui/icons/CheckIcon";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  followUps?: string[];
}

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onEndSession?: (sendSummary?: boolean) => void;
  messages?: ChatMessage[];
  onSendMessage?: (text: string, image?: string) => void;
  isLoading?: boolean;
}

export default function AiModal({ isOpen, onClose, message, onEndSession, messages, onSendMessage, isLoading }: AiModalProps) {
  const nodeRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const opacityBarRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const [opacity, setOpacity] = useState(1);
  const [showOpacityControl, setShowOpacityControl] = useState(false);
  const [terminationStep, setTerminationStep] = useState<'none' | 'confirm_end' | 'confirm_email'>('none');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

  // Input state
  const [input, setInput] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStartTime(Date.now());
    } else {
      setStartTime(null);
      setElapsedTime("00:00:00");
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (startTime !== null) {
      interval = setInterval(() => {
        const now = Date.now();
        const difference = now - startTime;

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const formatUnit = (unit: number) => unit.toString().padStart(2, "0");

        setElapsedTime(
          `${formatUnit(hours)}:${formatUnit(minutes)}:${formatUnit(seconds)}`
        );
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, message]);

  // Handle click outside opacity control
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showOpacityControl &&
        opacityBarRef.current &&
        !opacityBarRef.current.contains(event.target as Node) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(event.target as Node)
      ) {
        setShowOpacityControl(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOpacityControl]);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
        const image = await invoke<string>("capture_screen");
        setCapturedImage(image);
    } catch (e) {
        console.error("Failed to capture screen", e);
    } finally {
        setIsCapturing(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() && !capturedImage) return;
    if (onSendMessage) {
        onSendMessage(input, capturedImage || undefined);
    }
    setInput("");
    setCapturedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isCompact = !isLoading && (!messages || messages.length === 0) && !message;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-24">

      <Draggable nodeRef={nodeRef} handle=".drag-handle">
        {/* Modal */}
        <div 
          ref={nodeRef} 
          style={{ opacity }}
          className={`relative w-[600px] bg-[#4E4D4F] text-white rounded-xl p-2 shadow-xl flex flex-col gap-4 transition-all duration-300 ${isCompact ? 'h-auto' : ''}`}
        >

          {/* Header - Only show if not compact */}
          {!isCompact && (
            <div className="drag-handle flex items-center justify-between cursor-move">
                <span className="text-sm text-gray-400">{elapsedTime}</span>

                <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex border border-neutral-700 bg-[#141414] rounded-3xl">
                    <button className="px-3 py-1 text-sm">Sessão</button>
                    <button className="px-3 py-1 text-sm">Resumo</button>
                </div>
                
                
                <button 
                    className="px-3 py-1 border border-neutral-700 bg-[#141414] rounded-md text-sm hover:bg-[#141414]/60 transition text-red-600" 
                    onClick={() => setTerminationStep('confirm_end')}
                >
                    Encerrar Sessão
                </button>
                <button 
                    ref={settingsBtnRef}
                    onClick={() => setShowOpacityControl(!showOpacityControl)}
                    className={`p-2 rounded-md text-sm transition ${showOpacityControl ? "bg-blue-600" : "bg-gray-800"}`}
                >
                    <SettingsIcon size={24}/>
                </button>
                <button 
                    onClick={onClose}
                    className="px-3 py-1 bg-gray-800 rounded-md text-sm hover:bg-gray-700 transition flex items-center justify-center"
                    title="Minimizar"
                >
                    <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                </div>
            </div>
          )}

          {/* Corpo da mensagem - Only show if not compact */}
          {!isCompact && (
            <div className="bg-[#0c0c0c] p-4 rounded-lg border border-gray-700 h-[350px] overflow-y-auto flex flex-col gap-4">
                
                {messages && messages.length > 0 && (
                <>
                    {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`text-xs mb-1 ${msg.role === 'user' ? 'text-blue-400' : 'text-gray-500'}`}>
                        {msg.role === 'user' ? 'Você' : 'AI'} • {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                        <div className={`max-w-[90%] p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-900/20 text-blue-100' : 'bg-gray-800/30 text-gray-200'}`}>
                        <p className="whitespace-pre-line text-sm">{msg.content}</p>
                        {msg.role === 'assistant' && (
                            <button 
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="mt-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-600 transition"
                            >
                            Copiar
                            </button>
                        )}
                        </div>
                        {/* Follow-ups */}
                        {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 max-w-[90%]">
                                {msg.followUps.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSendMessage && onSendMessage(q)}
                                    className="px-3 py-1 text-xs border border-gray-600 rounded-full hover:bg-gray-700 transition text-gray-300 text-left"
                                >
                                    {q}
                                </button>
                                ))}
                            </div>
                        )}
                    </div>
                    ))}
                </>
                )}

                {/* Fallback / Single message view */}
                {(!messages || messages.length === 0) && message && (
                     <div className="flex flex-col">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-gray-500">Latest</span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(message)}
                                className="text-xs bg-gray-700 px-2 py-1 rounded">
                                Copiar
                            </button>
                        </div>
                        <p className="text-gray-200 whitespace-pre-line">
                            {message}
                        </p>
                     </div>
                 )}

                 {/* Loading Animation */}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800/30 p-3 rounded-lg flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                 )}

                <div ref={messagesEndRef} />
            </div>
          )}

          {/* Termination Flow UI */}
          {terminationStep !== 'none' && (
             <div className="bg-[#1a1a1a] border border-gray-600 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
               {terminationStep === 'confirm_end' && (
                  <div className="flex flex-col gap-2">
                     <p className="text-center text-sm text-white font-medium">Encerrar sessão?</p>
                     <div className="flex gap-2 justify-center">
                        <button 
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-semibold transition"
                          onClick={() => setTerminationStep('confirm_email')}
                        >
                          Sim
                        </button>
                        <button 
                          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                          onClick={() => setTerminationStep('none')}
                        >
                          Não
                        </button>
                     </div>
                  </div>
               )}
               {terminationStep === 'confirm_email' && (
                  <div className="flex flex-col gap-2">
                     <p className="text-center text-sm text-white font-medium">Enviar um resumo por email?</p>
                     <div className="flex gap-2 justify-center">
                        <button 
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold transition"
                          onClick={() => {
                            if (onEndSession) onEndSession(true);
                            setTerminationStep('none');
                          }}
                        >
                          Sim
                        </button>
                        <button 
                          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                          onClick={() => {
                             if (onEndSession) onEndSession(false);
                             setTerminationStep('none');
                          }}
                        >
                          Não
                        </button>
                     </div>
                  </div>
               )}
             </div>
          )}

          {/* Input Area (Replaces Footer) */}
          {terminationStep === 'none' && (
            <div className={`flex flex-col gap-2 ${isCompact ? 'drag-handle' : ''}`}> 
                {/* Captured Image Preview */}
                {capturedImage && (
                    <div className="relative w-fit">
                        <img 
                            src={capturedImage} 
                            alt="Captured" 
                            className="h-16 w-auto rounded-lg border border-white/20 shadow-lg"
                        />
                        <button 
                            onClick={() => setCapturedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        disabled={isLoading}
                        className={`flex-1 rounded-xl bg-transparent px-4 py-2
                                text-white placeholder-white/40 focus:outline-none text-sm transition-all
                                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Ask anything..."
                    />
                    
                    <button 
                      className="flex justify-center items-center gap-2 py-2 px-4 rounded-full hover:bg-white/10 text-white transition disabled:opacity-50"
                    >
                      <span className="text-sm font-medium">Auto focus</span> 
                      <span className="border border-white/40 rounded-lg p-0.5">
                        <CheckIcon size={14}/>
                      </span> 
                    </button>

                    <button 
                      className="flex items-center gap-2 py-2 px-4 rounded-full border border-white/40 hover:bg-white/10 transition text-white group"
                    >
                      <ZapIcon size={16}/>
                      <span className="text-sm font-medium">Smart</span>
                    </button>
                
                    <button 
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex justify-center items-center gap-2 py-2 px-4 rounded-full hover:bg-white/10 text-white transition disabled:opacity-50"
                    >
                      <span className="text-sm font-medium">Submit</span>
                      <span className="bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                          <path d="m9 10-5 5 5 5" />
                        </svg>
                      </span>
                    </button>
                </div>
            </div>
          )}

          {/* Opacity Control Bar */}
          {showOpacityControl && (
            <div 
              ref={opacityBarRef}
              className="absolute bottom-[-50px] left-0 right-0 mx-auto w-[90%] bg-[#111] border border-gray-700 rounded-lg p-3 flex items-center gap-3 shadow-xl z-[60]"
              onMouseDown={(e) => e.stopPropagation()} 
            >
              <span className="text-xs text-gray-400">Opacidade:</span>
              <input 
                type="range" 
                min="0.2" 
                max="1" 
                step="0.05" 
                value={opacity} 
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{Math.round(opacity * 100)}%</span>
            </div>
          )}

        </div>
      </Draggable>
    </div>
  );
}

