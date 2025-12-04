import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700">
        {/* botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {children}
      </div>
    </div>
  );
}

