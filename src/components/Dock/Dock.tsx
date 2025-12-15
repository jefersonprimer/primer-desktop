import { useRef } from "react";
import Draggable from "react-draggable";

import MessagesSquareIcon from "../ui/icons/MessagesSquareIcon";
import SettingsIcon from "../ui/icons/SettingsIcon";
import GeneralAssistant from "./GeneralAssistant";
import MicIcon from "../ui/icons/MicIcon";

interface DockProps {
  onOpenModal: (modal: string) => void;
  active?: boolean; // <- para indicar que o modal está aberto
  hasActiveSession?: boolean;
}

export default function Dock({ onOpenModal, active, hasActiveSession }: DockProps) {
  const nodeRef = useRef(null);

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle">
      <div
        ref={nodeRef}
        className="absolute bottom-6 left-0 right-0 mx-auto w-fit flex flex-col items-center gap-3 z-[9999]"
      >
        <GeneralAssistant onOpenChat={() => onOpenModal("chat")} />

        <div className="
          flex items-center gap-3
          bg-black/40 backdrop-blur-xl
          px-5 py-3 rounded-2xl
          border border-white/10
          shadow-lg
        ">
        {/* Drag Handle */}
        <div className="drag-handle cursor-grab active:cursor-grabbing p-2 -ml-2 mr-1 text-white/50 hover:text-white transition flex items-center justify-center">
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
          >
            <circle cx="9" cy="12" r="1"/>
            <circle cx="9" cy="5" r="1"/>
            <circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="12" r="1"/>
            <circle cx="15" cy="5" r="1"/>
            <circle cx="15" cy="19" r="1"/>
          </svg>
        </div>

        <button onClick={() => onOpenModal("settings")}
          className={`
          relative group
          flex flex-col items-center justify-center
          p-3 rounded-xl
          transition
          ${active ? "bg-white/20" : "hover:bg-white/10"}
        `}>
          <SettingsIcon size={24} color="#fff"/>  
        </button>

        <button onClick={() => onOpenModal("history")}
          className={`
            relative group
            flex flex-col items-center justify-center
            p-3 rounded-xl
            transition
            ${active ? "bg-white/20" : "hover:bg-white/10"}
          `}
        >
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
            className={`text-white transition-transform ${active ? "scale-110" : "group-hover:scale-125"}`}
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M12 7v5l4 2"/>
          </svg>
        </button>

        {hasActiveSession && (
          <button 
            onClick={() => onOpenModal("ai-response")}
            className={`
              relative group
              flex flex-col items-center justify-center
              p-3 rounded-xl
              transition
              ${active ? "bg-white/20" : "hover:bg-white/10"}
            `}
          >
            <MessagesSquareIcon size={18} color="#fff"/>
          </button>
        )}

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-white group"
          onClick={() => onOpenModal("chat")}
        >
          <span className="text-[12px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">Ctrl</span>
          <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            <svg 
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
              <path d="m9 10-5 5 5 5"/>
            </svg>
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

          <MicIcon size={18}/>
        </button>
        </div>
      </div>
    </Draggable>
  );
}
