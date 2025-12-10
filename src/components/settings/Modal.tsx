import { invoke } from "@tauri-apps/api/core";
import { type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, onSave, children }: ModalProps) {
  const onCloseApp = async () => {
    await invoke("close_app");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-[99999]">
      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700 flex flex-col">
        <div className="flex justify-between p-4 bg-black border-b border-neutral-700 shrink-0">
          <h1>Configurações</h1>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black hover:bg-[#F34325] rounded-xl z-20 cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
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
            >
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 relative w-full">
          {children}
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-black border-t border-neutral-700 rounded-b-xl shrink-0">
          <button
            className="text-zinc-400 hover:text-black hover:bg-[#F34325]/60 hover:border border-red-900 rounded p-1 transition flex items-center gap-2"
            onClick={onCloseApp}
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
              className="lucide lucide-power-icon lucide-power"
            >
              <path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>
            </svg>
          </button>

          <button
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg font-medium transition"
            onClick={onSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

