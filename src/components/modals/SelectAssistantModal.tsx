import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import AssistantsManagerModal from "./AssistantsManagerModal";
import CheckIcon from "@/components/ui/icons/CheckIcon";
import SettingsIcon from "@/components/ui/icons/SettingsIcon";

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
        className="fixed inset-0 z-[65] cursor-default bg-transparent" 
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className={`
          w-[240px] flex flex-col
          bg-[#414141] backdrop-blur-2xl border border-white/10
          rounded-xl shadow-2xl shadow-black/50
          z-[70] overflow-hidden
          ${positionClass || "absolute left-1/2 -translate-x-1/2 bottom-full mb-2"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1.5 max-h-[320px] overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            {assistants.length > 0 ? (
              assistants.map((a) => {
                const isSelected = value === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => onChange(a.id)}
                    className={`
                      w-full flex items-center justify-between
                      px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                      ${isSelected 
                        ? "bg-white/10 text-white font-medium" 
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <span className="truncate pr-2">{a.name}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                         <CheckIcon size={14} className="text-[#48CAE1]" />
                      </motion.div>
                    )}
                  </button>
                );
              })
            ) : (
                <div className="px-4 py-8 text-center text-xs text-neutral-500">
                    No assistants found
                </div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-1 border-t border-white/5">
            <button
                onClick={() => setShowAssistantManager(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors duration-200"
            >
                <SettingsIcon size={14} />
                <span>Manage Assistants</span>
            </button>
        </div>
      </motion.div>
    </>
  );
}
