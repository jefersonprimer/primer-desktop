import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Dock from "../../components/Dock/Dock";
import VisibleButton from "../../components/settings/VisibleButton"; 
import TopDock from "@/components/Dock/TopDock";

import AiModal from "@/components/AiModal";
import SettingsModal from "@/components/settings/SettingsModal";
import HistoryModal from "@/components/HistoryModal";
import VoiceChatModal from "@/components/Dock/VoiceChatModal";

import { useAuth } from "@/contexts/AuthContext";
import { useAi } from "@/contexts/AiContext";

interface CreateChatResponse {
  chat_id: string;
}

interface SendMessageResponse {
  message: {
    content: string;
    role: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function HomePage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);

  // History state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  
  const { userId } = useAuth();
  const { activeProvider, activeModel } = useAi();

  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const res = await invoke<{ chats: any[] }>("get_chats", { dto: { user_id: userId } });
      // Sort by newest first (assuming backend doesn't sort, or just to be safe)
      // Actually backend might not sort. Let's just map.
      const mapped = res.chats.map((c) => ({
        id: c.id,
        title: c.title || "Nova conversa",
        model: "Gemini",
        createdAt: new Date(c.created_at).toLocaleString(),
      }));
      setSessions(mapped);
    } catch (e) {
      console.error("Failed to fetch chats", e);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await invoke<{ messages: any[] }>("get_messages", { dto: { chat_id: sessionId } });
      const mapped = res.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.created_at,
      }));
      setHistoryMessages(mapped);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  useEffect(() => {
    if (activeModal === "history" && userId) {
      fetchSessions();
    }
  }, [activeModal, userId]);

  useEffect(() => {
    if (activeModal === "ai-response" && chatId) {
      fetchMessages(chatId);
    }
  }, [activeModal, chatId]);

  const handleChatSubmit = async (text: string, image?: string) => {
    if (!userId) {
        console.error("User not logged in");
        return;
    }

    // Close TopDock and Open AiModal with loading state
    setActiveModal("ai-response");
    setAiMessage("Processando...");

    try {
      let currentChatId = chatId;

      // Create chat if not exists
      if (!currentChatId) {
        const chatRes = await invoke<CreateChatResponse>("create_chat", {
          dto: {
            user_id: userId,
            title: text.substring(0, 30) || "New Chat",
          },
        });
        currentChatId = chatRes.chat_id;
        setChatId(currentChatId);
      }

      // Map provider name for backend
      const providerName = activeProvider === "Google" ? "Gemini" : activeProvider;
      
      // Send message
      const response = await invoke<SendMessageResponse>("send_message", {
        dto: {
          user_id: userId,
          chat_id: currentChatId,
          provider_name: providerName,
          content: text,
          model: activeModel || (activeProvider === "Google" ? "gemini-1.5-flash" : "gpt-4o"), 
          temperature: 0.7,
          image: image, // Pass the image
        },
      });

      setAiMessage(response.message.content);
      fetchMessages(currentChatId);

    } catch (error) {
      console.error("Chat error:", error);
      setAiMessage("Erro ao processar sua solicitação: " + error);
    }
  };

  const handleEndSession = async (sendSummary?: boolean) => {
    if (sendSummary && chatId && userId) {
      try {
        await invoke("send_chat_summary", { 
          dto: { 
            user_id: userId, 
            chat_id: chatId 
          } 
        });
        // Optionally show success message (e.g. toast), but for now we just close.
        console.log("Summary email sent successfully");
      } catch (e) {
        console.error("Failed to send summary email", e);
        alert("Falha ao enviar email com resumo: " + e);
      }
    }
    
    setChatId(null);
    setAiMessage("");
    setHistoryMessages([]);
    setActiveModal(null);
  };

  return (
  
    <div className="w-full max-w-[1440px] bg-transparent mx-auto h-screen relative">


      {/* TopDock */}
      {activeModal === "chat" && (
        <TopDock 
            onClose={() => setActiveModal(null)} 
            onSubmit={handleChatSubmit}
        />
      )}

      {/* AiModal */}
      <AiModal 
        isOpen={activeModal === "ai-response"} 
        onClose={() => setActiveModal(null)}
        message={aiMessage}
        messages={historyMessages}
        onEndSession={handleEndSession}
      />

      {/* Voice Chat Modal */}
      <VoiceChatModal 
        isOpen={activeModal === "listen"} 
        onClose={() => setActiveModal(null)} 
        onSend={handleChatSubmit}
      />

      {/* Settings Modal */}
       <SettingsModal 
        open={activeModal === "settings"} 
        onClose={() => setActiveModal(null)}
       />

      {/* History Modal */}
      <HistoryModal
        isOpen={activeModal === "history"}
        onClose={() => setActiveModal(null)}
        sessions={sessions}
        selected={selectedSession}
        onSelect={setSelectedSession}
        messages={historyMessages}
        onLoadMessages={fetchMessages}
        onDelete={async (sessionId) => {
            try {
                await invoke("delete_chat", { dto: { chat_id: sessionId } });
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (selectedSession?.id === sessionId) {
                    setSelectedSession(null);
                    setHistoryMessages([]);
                }
            } catch (e) {
                console.error("Failed to delete chat", e);
                alert("Erro ao apagar conversa");
            }
        }}
        onDeleteAll={async () => {
             if (!userId) return;
             try {
                await invoke("delete_all_chats", { dto: { user_id: userId } });
                setSessions([]);
                setSelectedSession(null);
                setHistoryMessages([]);
            } catch (e) {
                console.error("Failed to delete all chats", e);
                alert("Erro ao limpar histórico");
            }
        }}
      />

      {/* Dock */}
      <Dock 
        onOpenModal={(modal) => setActiveModal(modal)} 
        hasActiveSession={!!chatId}
      />
      
      <VisibleButton/>
    </div>
  );
}