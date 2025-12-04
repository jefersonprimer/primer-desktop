import { useRef } from "react";
import Draggable from "react-draggable";
import { Settings, History, CornerDownLeft, GripHorizontal } from "lucide-react";
import DockItem from "./DockItem";

interface DockProps {
  onOpenModal: (modal: string) => void;
}

export default function Dock({ onOpenModal }: DockProps) {
  const nodeRef = useRef(null);

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle">
      <div
        ref={nodeRef}
        className="
          fixed bottom-6 left-0 right-0 mx-auto w-fit
          flex items-center gap-3
          bg-black/40 backdrop-blur-xl
          px-5 py-3 rounded-2xl
          border border-white/10
          shadow-lg
          z-[9999]
        "
      >
        {/* Drag Handle */}
        <div className="drag-handle cursor-grab active:cursor-grabbing p-2 -ml-2 mr-1 text-white/50 hover:text-white transition flex items-center justify-center">
            <GripHorizontal size={20} />
        </div>

        <DockItem
          label="Settings"
          icon={Settings}
          onClick={() => onOpenModal("settings")}
        />

        <DockItem
          label="History"
          icon={History}
          onClick={() => onOpenModal("history")}
        />

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-white group"
          onClick={() => onOpenModal("chat")}
        >
          <span className="text-[12px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">Ctrl</span>
          <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            <CornerDownLeft size={14} className="text-white/70 group-hover:text-white transition" />
          </span>
          <span className="text-sm font-medium text-white/90 group-hover:text-white">Perguntar</span>
        </button>

        <button 
          className="
            flex items-center gap-2 px-3 py-2 rounded-xl 
            transition text-white group
            bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600
            hover:from-blue-100 hover:via-blue-400 hover:to-blue-700
          "
          onClick={() => onOpenModal('listen')}
        >
          <span className="text-[12px] font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            Ctrl
          </span>

          <span className="text-[12px] font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            D
          </span>

          <span className="text-sm font-medium text-white/90 group-hover:text-white transition">
            Começar a ouvir
          </span>
        </button>
      </div>
    </Draggable>
  );
}
