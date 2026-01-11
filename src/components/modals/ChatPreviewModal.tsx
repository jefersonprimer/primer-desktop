import { useEffect, useRef, useState } from "react";
import CloseIcon from "../ui/icons/CloseIcon";
import MailIcon from "../ui/icons/MailIcon";
import LinkIcon from "../ui/icons/LinkIcon";
import ChevronDownIcon from "../ui/icons/ChevronDownIcon";
import ChatHistory from "../ChatHistory";
import CopyIcon from "../ui/icons/CopyIcon";
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
        <div className="flex items-center justify-end gap-3 my-4">
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors text-sm border border-white/10 cursor-pointer"
          >
            <MailIcon size={16} />
            <span>Follow-up email</span>
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors text-sm border border-white/10 cursor-pointer"
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

        <div className="flex items-center justify-between my-4">
          <div className="flex items-center gap-4 px-4 py-2 bg-white/10 rounded-xl text-gray-400">
            <button>Summary</button>
            <button>Transcript</button>
            <button>Usage</button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-neutral-400">
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
            General
            <ChevronDownIcon size={16}/>
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 my-4 text-sm text-neutral-400">
          <button className="flex items-center gap-2">
            <CopyIcon size={16}/>
            Copy full summary
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
