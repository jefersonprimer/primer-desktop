import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dock } from "@/components/Dock";
import VisibleButton from "../../components/settings/VisibleButton"; 
import TopDock from "@/components/Dock/TopDock";

import AiModal from "@/components/AiModal";
import SettingsModal from "@/components/settings/SettingsModal";

import { useAuth } from "@/contexts/AuthContext";

interface CreateChatResponse {
  chat_id: string;
}

interface SendMessageResponse {
  message: {
    content: string;
    role: string;
  };
}

export default function HomePage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  
  const { userId } = useAuth();

  const handleChatSubmit = async (text: string) => {
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

      // Send message
      const response = await invoke<SendMessageResponse>("send_message", {
        dto: {
          user_id: userId,
          chat_id: currentChatId,
          provider_name: "Gemini",
          content: text,
          model: "gemini-2.5-flash", 
          temperature: 0.7,
        },
      });

      setAiMessage(response.message.content);

    } catch (error) {
      console.error("Chat error:", error);
      setAiMessage("Erro ao processar sua solicitação: " + error);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-600 relative">

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
      />

      {/* Settings Modal */}
       <SettingsModal 
        open={activeModal === "settings"} 
        onClose={() => setActiveModal(null)}
       />

      {/* Dock */}
      <Dock onOpenModal={(modal) => setActiveModal(modal)} />
      <VisibleButton/>
    </div>
  );
}
