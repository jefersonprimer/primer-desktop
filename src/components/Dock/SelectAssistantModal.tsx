import { useState } from "react";
import AssistantsManagerModal from "../AssistantsManagerModal";
import CheckIcon from "../ui/icons/CheckIcon";

interface Assistant {
  id: string;
  name: string;
  builtIn?: boolean;
}

const assistants: Assistant[] = [
  { id: "general", name: "General Assistant", builtIn: true },
  { id: "sales", name: "Sales Assistant", builtIn: true },
  { id: "leetcode", name: "LeetCode Assistant", builtIn: true },
  { id: "study", name: "Study Assistant", builtIn: true },
  { id: "tech", name: "Tech Candidate", builtIn: true },
];

interface Props {
  value: string;
  onChange: (id: string) => void;
  onClose: () => void;
}

export default function SelectAssistantModal({ value, onChange, onClose }: Props) {
  const [showAssistantManager, setShowAssistantManager] = useState(false);

  if (showAssistantManager) {
    return <AssistantsManagerModal open={true} onClose={() => setShowAssistantManager(false)} />;
  }

  return (
    <>
      {/* Invisible backdrop to handle click outside */}
      <div 
        className="fixed inset-0 z-[65] cursor-default" 
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
      />
      
      <div
        className="
          absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[330px]
          bg-black/70 backdrop-blur-xl border border-white/10
          rounded-xl shadow-xl py-2 z-[70]
        "
      >
        <h3 className="text-white font-semibold text-sm px-4 py-2 bg-black/60">
          Select Assistant
        </h3>

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
                px-4 py-2 text-white text-sm
                hover:bg-white/10 transition border-b border-gray-400
              `}
            >
              <div className="flex flex-col text-left">
                <span>{a.name}</span>
                {a.builtIn && (
                  <span className="text-xs text-white/50">Built-in</span>
                )}
              </div>

              {value === a.id && (
                <CheckIcon size={16} color="white"/>   
              )}
            </button>
          ))}
        </div>
        <button
          onClick={(e) => {
              e.stopPropagation();
              setShowAssistantManager(true);
          }}
          className="w-full text-left px-4 py-3 border-t border-gray-400 text-white text-sm hover:bg-white/10 transition">
          Gerenciar Assistentes
        </button>
      </div>
    </>
  );
}

