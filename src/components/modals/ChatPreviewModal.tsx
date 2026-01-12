import { useEffect, useRef, useState } from "react";
import MailIcon from "../ui/icons/MailIcon";
import LinkIcon from "../ui/icons/LinkIcon";
import ChevronDownIcon from "../ui/icons/ChevronDownIcon";
import ChatHistory from "../ChatHistory";
import CopyIcon from "../ui/icons/CopyIcon";
import CheckIcon from "../ui/icons/CheckIcon";
import MicIcon from "../ui/icons/MicIcon";
import AudioLinesIcon from "../ui/icons/AudioLinesIcon";

import { invoke } from "@tauri-apps/api/core";
import SelectAssistantModal from "./SelectAssistantModal";
import { EmailSummaryModal } from "./EmailSummaryModal";
import { getPromptPresets, type PromptPreset } from "@/lib/tauri";
import { useAi } from "@/contexts/AiContext";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface SendMessageResponse {
  message: {
    content: string;
    role: string;
  };
  follow_ups: string[];
}

interface ChatPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
}

export default function ChatPreviewModal({ isOpen, session }: ChatPreviewModalProps) {
  const { userId } = useAuth();
  const { activePromptPreset, activeModel, activeProvider, outputLanguage } = useAi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showAssistantPicker, setShowAssistantPicker] = useState(false);
  const [presetId, setPresetId] = useState(activePromptPreset || "general");
  const [presetName, setPresetName] = useState("General");
  const [presets, setPresets] = useState<PromptPreset[]>([]);
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "usage">("summary");
  const [isCopied, setIsCopied] = useState(false);

  // Chat Input State
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Email Summary Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    if (isOpen && session) {
      loadMessages(session.id);
      loadPresets();
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (isOpen && activePromptPreset) {
      setPresetId(activePromptPreset);
    }
  }, [isOpen, activePromptPreset]);

  const loadPresets = async () => {
    try {
      const data = await getPromptPresets();
      setPresets(data);
      
      const currentId = presetId || activePromptPreset || "general";
      const found = data.find(p => p.id === currentId);
      if (found) {
        setPresetName(found.name);
      }
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  };

  const loadMessages = async (chatId: string) => {
    setIsLoading(true);
    try {
      const res = await invoke<{ messages: any[] }>("get_messages", { dto: { chat_id: chatId } });
      const mapped: ChatMessage[] = res.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.created_at,
      }));
      setMessages(mapped);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages load or new message added
  useEffect(() => {
    if (messagesEndRef.current) {
        // Small timeout to ensure rendering
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }
  }, [messages, isOpen, isSending]);

  const handlePresetChange = (id: string) => {
    setPresetId(id);
    const found = presets.find(p => p.id === id);
    if (found) {
      setPresetName(found.name);
    }
    setShowAssistantPicker(false);
  };

  const handleCopySummary = async () => {
    if (messages.length === 0) return;

    const text = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'} (${new Date(m.createdAt).toLocaleString()}): ${m.content}`)
      .join('\n\n');
    
    try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
  };

  const handleOpenEmailModal = () => {
    if (messages.length === 0) return;

    const text = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}:\n${m.content}`)
      .join('\n\n');
    
    setEmailBody(text);
    setIsEmailModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session || !userId) return;

    const text = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const providerName = activeProvider === "Google" ? "Gemini" : activeProvider;
      
      const response = await invoke<SendMessageResponse>("send_message", {
        dto: {
          user_id: userId,
          chat_id: session.id,
          provider_name: providerName,
          content: text,
          model: activeModel || (activeProvider === "Google" ? "gemini-1.5-flash" : "gpt-4o"),
          temperature: 0.7,
          output_language: outputLanguage,
        },
      });

      // Add AI response
      const aiMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: response.message.content,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Optionally reload all messages to ensure sync/IDs
      // loadMessages(session.id); 

    } catch (error) {
      console.error("Chat error:", error);
      // Ideally show error toast or message
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !session) return null;

  return (
    <>
      <div className="fixed top-12 left-1 right-1 bottom-1 bg-[#212121] z-[100] animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col rounded-lg overflow-hidden">
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0 relative">
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
              
              {/* Header */}
              <div className="flex items-center justify-end gap-3 mb-4">
              <button 
                  onClick={handleOpenEmailModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors text-sm border border-white/10"
              >
                  <MailIcon size={16} />
                  <span>Follow-up email</span>
              </button>
              <button 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors text-sm border border-white/10"
              >
                  <LinkIcon size={16} />
                  <span>Share</span>
                  <ChevronDownIcon size={16}/> 
              </button>
              </div>

              <div className="flex items-center justify-between">
              <div className="flex flex-col">
                  <h1 className="text-3xl font-semibold text-white">{session.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-white/50">{session.model}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-sm text-white/50">{session.createdAt.toLocaleString()}</span>
                  </div>
              </div>
              </div>

              <div className="flex items-center justify-between my-6 relative">
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button 
                  onClick={() => setActiveTab("summary")}
                  className={`px-4 py-1.5 rounded-xl text-sm transition-all duration-200 ${
                      activeTab === "summary" 
                      ? "bg-white/10 text-white shadow-sm font-medium" 
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                  >
                  Summary
                  </button>
                  <button 
                  onClick={() => setActiveTab("transcript")}
                  className={`px-4 py-1.5 rounded-xl text-sm transition-all duration-200 ${
                      activeTab === "transcript" 
                      ? "bg-white/10 text-white shadow-sm font-medium" 
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                  >
                  Transcript
                  </button>
                  <button 
                  onClick={() => setActiveTab("usage")}
                  className={`px-4 py-1.5 rounded-xl text-sm transition-all duration-200 ${
                      activeTab === "usage" 
                      ? "bg-white/10 text-white shadow-sm font-medium" 
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                  >
                  Usage
                  </button>
              </div>

              <div className="relative">
                  <button 
                  onClick={() => setShowAssistantPicker(!showAssistantPicker)}
                  className="flex items-center gap-2 p-2 bg-white/10 hover:bg-[#414141] rounded-2xl border border-white/10 text-neutral-400 hover:text-white transition-colors"
                  >
                  <svg 
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  >
                      <path d="M14 17H5"/>
                      <path d="M19 7h-9"/>
                      <circle cx="17" cy="17" r="3"/>
                      <circle cx="7" cy="7" r="3"/>
                  </svg>
                  {presetName}
                  <ChevronDownIcon size={16}/>
                  </button>
                  
                  {showAssistantPicker && (
                  <SelectAssistantModal
                      value={presetId}
                      onChange={handlePresetChange}
                      onClose={() => setShowAssistantPicker(false)}
                      positionClass="absolute right-0 top-full mt-2"
                  />
                  )}
              </div>
              </div>

              {/* Content */}
              <div className="flex-1 pr-2 pb-4">
              {isLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                  </div>
              ) : (
                  <>
                  {activeTab === "summary" && (
                      <>
                        <ChatHistory messages={messages} />
                        {isSending && (
                            <div className="flex justify-start mt-4">
                                <div className="py-2 px-3 rounded-lg flex items-center gap-1.5 bg-white/5">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />

                        <div>
                          <button 
                              onClick={handleCopySummary}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                              title="Copy Summary"
                          >
                              {isCopied ? <CheckIcon size={16}/> : <CopyIcon size={16}/>}
                          </button>
                        </div>
                      </>
                  )}
                  {activeTab === "transcript" && (
                      <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2 min-h-[200px]">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                          </div>
                          <p>No audio transcript available</p>
                      </div>
                  )}
                  {activeTab === "usage" && (
                      <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2 min-h-[200px]">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                          </div>
                          <p>Usage statistics not available</p>
                      </div>
                  )}
                  </>
              )}
              </div>
          </div>

          {/* Sticky Input Footer */}
          {activeTab === "summary" && (
              <div className="pb-4">
                <div className={`flex items-center gap-2 w-full rounded-full bg-white/5 p-2 border border-white/5 focus-within:border-white/20 transition-all ${isSending ? 'opacity-50' : ''}`}>
                  <input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isSending}
                      className="flex-1 bg-transparent px-3 py-2 text-white placeholder-white/40 focus:outline-none text-sm"
                      placeholder="Ask anything..."
                  />

                  <div className="flex items-center gap-1">
                    <button 
                      className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Dictate"
                    >
                      <MicIcon size={18}/>
                    </button>

                    <button
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                      title="Use voice mode"
                    >
                      <AudioLinesIcon size={18}/>
                    </button>
                  </div>
                </div>
              </div>
          )}

        </div>
      </div>
      <EmailSummaryModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialBody={emailBody}
      />
    </>
  );
}
