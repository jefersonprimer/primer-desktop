import { useEffect, useRef, useState } from "react";
import CloseIcon from "../ui/icons/CloseIcon";
import ChatHistory from "../ChatHistory";
import { invoke } from "@tauri-apps/api/core";

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

interface ChatPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
}

export default function ChatPreviewModal({ isOpen, onClose, session }: ChatPreviewModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && session) {
      loadMessages(session.id);
    }
  }, [isOpen, session]);

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

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messagesEndRef.current) {
        // Small timeout to ensure rendering
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen || !session) return null;

  return (
    <div className="fixed top-14 left-0 right-0 bottom-0 bg-[#121214]/95 backdrop-blur-md z-[100] animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-white">{session.title}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-white/50">{session.model}</span>
                <span className="text-white/20">•</span>
                <span className="text-sm text-white/50">{session.createdAt.toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : (
            <>
                <ChatHistory messages={messages} />
                <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
