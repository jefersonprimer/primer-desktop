import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import { useAuth } from "@/contexts/AuthContext";
import { useAi } from "@/contexts/AiContext";
import { useCalendarEventHandler } from "@/hooks/useCalendarEventHandler";

import Dock from "@/components/Dock";

import AiModal from "@/components/modals/AiModal";
import SettingsModal from "@/components/settings/SettingsModal";
import HistoryModal from "@/components/modals/HistoryModal";

interface CreateChatResponse {
  chat_id: string;
}

interface SendMessageResponse {
  message: {
    content: string;
    role: string;
  };
  follow_ups: string[];
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
  followUps?: string[];
}

export default function HomePage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showAiInput, setShowAiInput] = useState(true);

  // History state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);

  const { userId } = useAuth();
  const {
    activeProvider,
    activeModel,
    activePromptPreset,
    activeSummaryPreset,
    outputLanguage,
    setLastUserMessage
  } = useAi();

  // Calendar preview integration
  const { processAiResponse } = useCalendarEventHandler();

  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const res = await invoke<{ chats: any[] }>("get_chats", { dto: { user_id: userId } });
      const mapped = res.chats.map((c) => ({
        id: c.id,
        title: c.title || "Nova conversa",
        model: c.model || "Gemini",
        createdAt: new Date(c.created_at).toLocaleString(),
      }));
      setSessions(mapped);
    } catch (e) {
      console.error("Failed to fetch chats", e);
    }
  };

  const fetchMessages = async (sessionId: string, lastFollowUps?: string[]) => {
    try {
      const res = await invoke<{ messages: any[] }>("get_messages", { dto: { chat_id: sessionId } });
      const mapped: ChatMessage[] = res.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.created_at,
      }));

      if (lastFollowUps && mapped.length > 0) {
        mapped[mapped.length - 1].followUps = lastFollowUps;
      }

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
    if ((activeModal === "chat") && chatId) {
      // If we already have messages (e.g. from submit), don't fetch immediately unless chatId changed
      // But here we might want to refresh.
      if (historyMessages.length === 0) {
        fetchMessages(chatId);
      }
    }
  }, [activeModal, chatId]);

  const handleChatSubmit = async (text: string, image?: string) => {
    if (!userId) {
      console.error("User not logged in");
      return;
    }

    // Open AiModal with loading state
    setActiveModal("chat");
    setIsLoading(true);
    setPendingMessage(text);
    setLastUserMessage(text);
    setShowAiInput(false);

    try {
      let currentChatId = chatId;

      // Create chat if not exists
      if (!currentChatId) {
        const chatRes = await invoke<CreateChatResponse>("create_chat", {
          dto: {
            user_id: userId,
            title: text.substring(0, 30) || "New Chat",
            prompt_preset_id: activePromptPreset?.trim() || "general",
            model: activeModel || (activeProvider === "Google" ? "gemini-1.5-flash" : "gpt-4o"),
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
          output_language: outputLanguage,
        },
      });

      setAiMessage(response.message.content);
      await fetchMessages(currentChatId, response.follow_ups);

      // Process AI response for calendar event intents
      // This will show preview or create event directly based on confidence
      processAiResponse(response.message.content);

    } catch (error) {
      console.error("Chat error:", error);
      setAiMessage("Erro ao processar sua solicitação: " + error);
    } finally {
      setIsLoading(false);
      setPendingMessage(null);
    }
  };

  const handleEndSession = (sendSummary?: boolean) => {
    // Fire-and-forget: send email in background, don't block UI
    if (sendSummary && chatId && userId) {
      // No await - triggers email sending and immediately continues
      invoke("send_chat_summary", {
        dto: {
          user_id: userId,
          chat_id: chatId,
          summary_preset_id: activeSummaryPreset
        }
      })
        .then(() => console.log("Summary email sent successfully"))
        .catch((e) => console.error("Failed to send summary email", e));
    }

    // Close modal immediately - no waiting for email
    setChatId(null);
    setAiMessage("");
    setHistoryMessages([]);
    setActiveModal(null);
    setPendingMessage(null);
  };

  const handleOpenModal = (modal: string) => {
    if (modal === "chat") {
      if (activeModal === "chat") {
        const hasContent = isLoading || historyMessages.length > 0 || aiMessage;

        if (!hasContent) {
          // If no content, simply close the modal
          setActiveModal(null);
        } else {
          // Toggle input visibility only, keep modal open
          setShowAiInput((prev) => !prev);
        }
      } else {
        // Open/ensure visible and show input
        setActiveModal("chat");
        setShowAiInput(true);
      }
    } else {
      setActiveModal(modal);
    }
  };

  return (
    <div className="w-full max-w-[1440px] bg-transparent mx-auto h-screen relative">

      <AiModal
        isOpen={activeModal === "chat" || activeModal === "ai-response"}
        onClose={() => setActiveModal(null)}
        message={aiMessage}
        messages={historyMessages}
        isLoading={isLoading}
        pendingMessage={pendingMessage}
        onEndSession={handleEndSession}
        onSendMessage={handleChatSubmit}
        showInput={showAiInput}
      />

      <SettingsModal
        open={activeModal === "settings"}
        onClose={() => setActiveModal(null)}
      />

      <HistoryModal
        isOpen={activeModal === "history"}
        onClose={() => setActiveModal(null)}
        sessions={sessions}
        selected={selectedSession}
        onSelect={setSelectedSession}
        messages={historyMessages}
        onLoadMessages={fetchMessages}
        userId={userId}
        onDelete={async (sessionId: string) => {
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

      <Dock
        onOpenModal={handleOpenModal}
        onClose={() => setActiveModal(null)}
        onActionSelected={(action: string) => handleChatSubmit(action)}
        aiModalOpen={activeModal === "chat" || activeModal === "ai-response"}
        isInputVisible={showAiInput}
      />
    </div>
  );
}
