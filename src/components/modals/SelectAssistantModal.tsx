import { useState, useEffect } from "react";

import AssistantsManagerModal from "./AssistantsManagerModal";
import CheckIcon from "@/components/ui/icons/CheckIcon";

import { getPromptPresets, type PromptPreset } from "@/lib/tauri";

interface Props {
  value: string;
  onChange: (id: string) => void;
  onClose: () => void;
  positionClass?: string;
}

export default function SelectAssistantModal({ value, onChange, onClose, positionClass }: Props) {
  const [showAssistantManager, setShowAssistantManager] = useState(false);
  const [assistants, setAssistants] = useState<PromptPreset[]>([]);

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    // Reload when manager closes to reflect changes
    if (!showAssistantManager) {
      loadPresets();
    }
  }, [showAssistantManager]);

  async function loadPresets() {
    try {
      const data = await getPromptPresets();
      setAssistants(data);
    } catch (e) {
      console.error(e);
    }
  }

  if (showAssistantManager) {
    return <AssistantsManagerModal open={true} onClose={() => setShowAssistantManager(false)} />;
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-[65] cursor-default" 
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
      />
      
      <div
        className={`
          w-[224px] p-2 bg-black/70 backdrop-blur-xl border border-white/10
          rounded-lg z-[70]
          ${positionClass || "absolute left-1/2 -translate-x-1/2 bottom-full mb-2"}
        `}
      >

        <div className="max-h-[240px] overflow-y-auto">
          {assistants.map(a => (
            <button
              key={a.id}
              onClick={(e) => {
                e.stopPropagation();
                onChange(a.id);
              }}
              className={`
                w-full flex items-center justify-between 
                px-4 py-2 text-white text-sm rounded-lg
                hover:bg-white/10 transition 
              `}
            >
              <div className="flex flex-col text-left">
                <span>{a.name}</span>
              </div>

              {value === a.id && (
                <CheckIcon size={16} color="white"/>   
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
