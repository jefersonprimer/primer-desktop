import { useState } from "react";
import SelectAssistantModal from "./SelectAssistantModal";
import { useAi } from "../../contexts/AiContext";

interface GeneralAssistantProps {
  onOpenChat: () => void;
}

export default function GeneralAssistant({ onOpenChat }: GeneralAssistantProps) {
  const [isSelectAssistantModalOpen, setIsSelectAssistantModalOpen] = useState(false);
  const { activePromptPreset, setActivePromptPreset } = useAi();

  const handleAssistantChange = (id: string) => {
    setActivePromptPreset(id);
    setIsSelectAssistantModalOpen(false);
    onOpenChat();
  };

  return (
    <div className="relative z-[60] select-none">
      <div
        className="bg-black/60 backdrop-blur-xl text-white border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-black/70 transition"
        onClick={() => setIsSelectAssistantModalOpen(true)}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 18V5"/>
          <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
          <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
          <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/>
          <path d="M18 18a4 4 0 0 0 2-7.464"/>
          <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/>
          <path d="M6 18a4 4 0 0 1-2-7.464"/>
          <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
        </svg>
        <span className="text-white text-sm">General Assistant</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className={`w-4 h-4 text-white transition ${isSelectAssistantModalOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>

      {isSelectAssistantModalOpen && (
        <SelectAssistantModal
          value={activePromptPreset}
          onChange={handleAssistantChange}
          onClose={() => setIsSelectAssistantModalOpen(false)}
        />
      )}
    </div>
  );
}

