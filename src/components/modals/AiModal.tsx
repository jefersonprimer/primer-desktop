import { invoke } from "@tauri-apps/api/core";

import { useRef, useEffect, useState } from "react";
import Draggable from "react-draggable";
import { useNotification } from "../../contexts/NotificationContext";

import ZapIcon from "../ui/icons/ZapIcon";
import CheckIcon from "../ui/icons/CheckIcon";
import CopyIcon from "../ui/icons/CopyIcon";
import CloseIcon from "../ui/icons/CloseIcon";
import EventPreviewCard from "../calendar/EventPreviewCard";

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
  pendingMessage?: string | null;
  showInput?: boolean;
}

export default function AiModal({ isOpen, message, onEndSession, messages, onSendMessage, isLoading, pendingMessage, showInput = true }: AiModalProps) {
  const nodeRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addNotification } = useNotification();
  const [terminationStep, setTerminationStep] = useState<'none' | 'confirm_end' | 'confirm_email'>('none');
  const [isCopied, setIsCopied] = useState(false);

  const [input, setInput] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const [autoFocusEnabled, setAutoFocusEnabled] = useState(() => {
    return localStorage.getItem("ai_modal_autofocus") === "true";
  });

  // Handle auto-focus on mount or when visibility changes
  useEffect(() => {
    if (autoFocusEnabled && isOpen && showInput) {
      // Small timeout to ensure render is complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, autoFocusEnabled, showInput]);

  const toggleAutoFocus = () => {
    const newState = !autoFocusEnabled;
    setAutoFocusEnabled(newState);
    localStorage.setItem("ai_modal_autofocus", String(newState));

    // If enabling, focus immediately (which will hide the button)
    if (newState) {
      inputRef.current?.focus();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, message]);

  const handleCaptureScreen = async () => {
    try {
      // Permission hint logic
      const hasUsedScreen = localStorage.getItem('has_used_screen_capture');
      if (!hasUsedScreen) {
        addNotification({
          title: 'Permission Required',
          message: 'PrimerAI needs access to record your screen for screenshots.',
          type: 'info',
          duration: 10000,
          actions: [
            {
              label: 'Open Settings',
              onClick: () => invoke('open_system_settings', { settingType: 'screen' }),
              variant: 'primary'
            },
            {
              label: 'Continue',
              onClick: () => { /* Dismiss */ },
              variant: 'secondary'
            }
          ]
        });
        localStorage.setItem('has_used_screen_capture', 'true');
      }

      const base64Image = await invoke<string>("capture_screen");
      setCapturedImage(base64Image);
      return base64Image;
    } catch (error) {
      console.error("Failed to capture screen:", error);
      addNotification({
        title: 'Screenshot Failed',
        message: 'Could not capture screen. Please check your screen recording permissions.',
        type: 'error',
        actions: [
          {
            label: 'Open Settings',
            onClick: () => invoke('open_system_settings', { settingType: 'screen' }),
            variant: 'primary'
          }
        ]
      });
      return null;
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isOpen && (e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        handleCaptureScreen();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleScrollShortcut = (e: KeyboardEvent) => {
      if (isOpen && (e.ctrlKey || e.metaKey)) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          scrollContainerRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          scrollContainerRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener("keydown", handleScrollShortcut);
    return () => window.removeEventListener("keydown", handleScrollShortcut);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!input.trim() && !capturedImage) return;

    let imageToSend = capturedImage;

    const lowerInput = input.trim().toLowerCase();
    const triggers = [
      "tela", "vendo", "mostrando", "vê", "ve", "resolva", "analise", "print", "screenshot",
      "screen", "seeing", "showing", "see", "solve", "analyze", "look", "olha"
    ];

    if (triggers.some(t => lowerInput.includes(t)) && !imageToSend) {
      // Hide window temporarily? Actually, standard capture captures everything. 
      // We might capture the modal itself if we are not careful, but usually we want to capture what's BEHIND.
      // However, 'capture_screen' likely captures the whole desktop.
      // For better UX, we might want to hide the modal briefly, but that's complex async logic with state.
      // For now, let's just capture.
      imageToSend = await handleCaptureScreen() || null; // Force null if null/undefined
    }

    if (onSendMessage) {
      onSendMessage(input, imageToSend || undefined);
    }
    setInput("");
    setCapturedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isCompact = !isLoading && (!messages || messages.length === 0) && !message;
  const lastUserMessage = pendingMessage || messages?.slice().reverse().find(m => m.role === 'user')?.content;

  if (!isOpen) return null; // onClose is implicitly used here. TypeScript might still complain if not explicitly referenced elsewhere.

  if (isCompact && !showInput) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-24">

      <Draggable nodeRef={nodeRef} handle=".drag-handle">
        <div
          ref={nodeRef}
          className={`relative w-[600px] bg-[#4E4D4F] text-white rounded-xl p-2 shadow-xl flex flex-col gap-4 transition-all duration-300 ${isCompact ? 'h-auto' : ''}`}
        >

          {!isCompact && (
            <div className="drag-handle flex items-center justify-between cursor-move px-2 pt-1">
              <div className="flex items-center overflow-hidden gap-2">
                <span className="text-xs border border-white px-1 rounded-full">P</span>
                <span className="text-sm font-medium">
                  {isLoading ? "Thinking..." : "Ai response"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">

                {lastUserMessage && (
                  <div className="text-xs text-white bg-[#707071] hover:bg-white/10 p-2 rounded-full truncate max-w-[300px]">
                    {lastUserMessage}
                  </div>
                )}

                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#141414]/80 transition"
                  title="Good for coding, reasoning, and web searches"
                >
                  <ZapIcon size={16} />
                </button>

                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#141414]/80 transition"
                  onClick={() => {
                    const allAiResponses = messages
                      ?.filter((msg) => msg.role === "assistant")
                      .map((msg) => msg.content)
                      .join("\n\n"); // Join with double newline for readability

                    const textToCopy =
                      allAiResponses && allAiResponses.length > 0
                        ? allAiResponses
                        : message;
                    navigator.clipboard.writeText(textToCopy);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  title="Copy"
                >
                  {isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                </button>

                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#141414]/80 transition"
                  onClick={() => setTerminationStep('confirm_end')}
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            </div>
          )}

          {!isCompact && (
            <div ref={scrollContainerRef} className="px-4 max-h-96 overflow-y-auto flex flex-col gap-4">

              {messages && messages.length > 0 && (
                <>
                  {messages.map((msg) => (
                    msg.role === 'assistant' && (
                      <div key={msg.id} className={`flex flex-col items-start`}>
                        <div className={`text-xs mb-1 text-gray-500`}>
                        </div>
                        <div className={`max-w-full p-2 text-gray-200`}>
                          <p className="whitespace-pre-line text-sm">{msg.content}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="mt-2 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-600 transition"
                          >
                            Copiar
                          </button>
                        </div>
                        {/* Follow-ups */}
                        {msg.followUps && msg.followUps.length > 0 && (
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
                    )
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

              {isLoading && (
                <div className="flex justify-start">
                  <div className="py-2 rounded-lg flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}

              {/* Calendar Event Preview Card */}
              <EventPreviewCard />

              <div ref={messagesEndRef} />
            </div>
          )}

          {terminationStep !== 'none' && (
            <div className=" border-t border-white/10 p-3 animate-in fade-in slide-in-from-top-2">
              {terminationStep === 'confirm_end' && (
                <div className="flex items-center gap-2">
                  <p className="text-center text-sm text-white font-medium">End session?</p>
                  <button
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-semibold transition"
                    onClick={() => setTerminationStep('confirm_email')}
                  >
                    Yes
                  </button>
                  <button
                    className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                    onClick={() => setTerminationStep('none')}
                  >
                    No
                  </button>
                </div>
              )}
              {terminationStep === 'confirm_email' && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium">Send a summary by email?</p>
                  <button
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold transition"
                    onClick={() => {
                      if (onEndSession) onEndSession(true);
                      setTerminationStep('none');
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                    onClick={() => {
                      if (onEndSession) onEndSession(false);
                      setTerminationStep('none');
                    }}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input Area (Replaces Footer) */}
          {terminationStep === 'none' && showInput && (
            <div className={`flex flex-col gap-2 ${!isCompact ? 'border-t border-white/10 pt-2' : ''} ${isCompact ? 'drag-handle' : ''}`}>
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

              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isLoading}
                  className={`flex-1 rounded-xl bg-transparent px-4 py-2
                          text-white placeholder-white/40 focus:outline-none focus:ring-0 border-none outline-none text-sm transition-all
                          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Ask anything..."
                />

                {!isFocused && (
                  <button
                    onClick={toggleAutoFocus}
                    className="flex justify-center items-center gap-2 py-2 px-4 rounded-full hover:bg-white/10 text-white opacity-40 transition disabled:opacity-50"
                  >
                    <span className="text-sm font-medium">Auto focus</span>
                    <span className="border border-white/40 rounded-lg p-0.5 min-w-[22px] min-h-[22px] flex items-center justify-center">
                      {autoFocusEnabled && <CheckIcon size={14} />}
                    </span>
                  </button>
                )}

                <button
                  className="flex items-center gap-2 py-2 px-4 rounded-full border border-white/40 hover:bg-white/10 transition text-white group"
                  title="Good for coding, reasoning, and web searches"
                >
                  <ZapIcon size={16} />
                  {!isFocused && (
                    <span className="text-sm font-medium">Smart</span>
                  )}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex justify-center items-center gap-2 py-2 px-4 rounded-full hover:bg-white/10 text-white transition disabled:opacity-50 group"
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

        </div>
      </Draggable>
    </div>
  );
}
