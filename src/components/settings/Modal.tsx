import { type ReactNode, useRef } from "react";
import { X } from "lucide-react";
import Draggable from "react-draggable";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const nodeRef = useRef(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50">
      <Draggable nodeRef={nodeRef} handle=".modal-drag-handle">
        <div ref={nodeRef} className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700">
          
          {/* Drag Handle Bar */}
          <div className="modal-drag-handle absolute top-0 left-0 w-full h-10 bg-transparent cursor-move z-10" />

          {/* botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-neutral-400 hover:text-white z-20 cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X size={24} />
          </button>

          {children}
        </div>
      </Draggable>
    </div>
  );
}

