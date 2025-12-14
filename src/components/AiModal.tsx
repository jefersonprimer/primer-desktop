import { useRef, useEffect, useState } from "react";
import Draggable from "react-draggable";
import SettingsIcon from "./ui/icons/SettingsIcon";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onEndSession?: (sendSummary?: boolean) => void;
  messages?: ChatMessage[];
}

export default function AiModal({ isOpen, onClose, message, onEndSession, messages }: AiModalProps) {
  const nodeRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const opacityBarRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const [opacity, setOpacity] = useState(1);
  const [showOpacityControl, setShowOpacityControl] = useState(false);
  const [terminationStep, setTerminationStep] = useState<'none' | 'confirm_end' | 'confirm_email'>('none');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">

      <Draggable nodeRef={nodeRef} handle=".drag-handle">
        {/* Modal */}
        <div 
          ref={nodeRef} 
          style={{ opacity }}
          className="relative w-[500px] bg-[#111] text-white rounded-xl p-4 shadow-xl border border-gray-700"
        >

          {/* Header */}
          <div className="drag-handle flex items-center justify-between mb-4 cursor-move">
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

          {/* Corpo da mensagem */}
          <div className="bg-[#0c0c0c] p-4 rounded-lg border border-gray-700 h-[350px] overflow-y-auto flex flex-col gap-4">
            
            {messages && messages.length > 0 ? (
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
                  </div>
                ))}
              </>
            ) : (
              // Fallback / Single message view
              <>
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
              </>
            )}

            {/* Follow-ups */}
            <button className="mt-auto px-3 py-2 bg-gray-800 rounded-md text-sm self-center w-full">
              Load follow-ups
            </button>
            <div ref={messagesEndRef} />
          </div>

          {/* Termination Flow UI */}
          {terminationStep !== 'none' && (
             <div className="mt-2 bg-[#1a1a1a] border border-gray-600 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
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

          {/* Footer */}
          {terminationStep === 'none' && (
            <div className="mt-4 flex items-center justify-between">
                <button className="px-3 py-2 bg-gray-800 rounded-md">❤️ Sugestões de Prompt</button>
                
                <div className="flex gap-2">
                <button className="px-3 py-2 bg-gray-800 rounded-md">Perguntar</button>
                <button className="px-3 py-2 bg-blue-700 rounded-md">Começar a Ouvir</button>
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

