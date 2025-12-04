import { useRef } from "react";
import Draggable from "react-draggable";

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function AiModal({ isOpen, onClose, message }: AiModalProps) {
  const nodeRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <Draggable nodeRef={nodeRef} handle=".drag-handle">
        {/* Modal */}
        <div ref={nodeRef} className="w-[500px] bg-[#111] text-white rounded-xl p-4 shadow-xl border border-gray-700">

          {/* Header */}
          <div className="drag-handle flex items-center justify-between mb-4 cursor-move">
            <span className="text-sm text-gray-400">00:00:13</span>

            <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button className="px-3 py-1 bg-gray-800 rounded-md text-sm">Sessão</button>
              <button className="px-3 py-1 bg-gray-800 rounded-md text-sm">Resumo</button>
              <button className="px-3 py-1 bg-red-700 rounded-md text-sm" onClick={onClose}>Encerrar Sessão</button>
              <button className="px-3 py-1 bg-gray-800 rounded-md text-sm">⚙</button>
            </div>
          </div>

          {/* Corpo da mensagem */}
          <div className="bg-[#0c0c0c] p-4 rounded-lg border border-gray-700 h-[350px] overflow-y-auto">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-500">9:29:27 AM</span>
              <button 
                onClick={() => navigator.clipboard.writeText(message)}
                className="text-xs bg-gray-700 px-2 py-1 rounded">
                Copiar
              </button>
            </div>

            <p className="text-gray-200 whitespace-pre-line">
              {message}
            </p>

            {/* Follow-ups */}
            <button className="mt-4 px-3 py-2 bg-gray-800 rounded-md text-sm">
              Load follow-ups
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <button className="px-3 py-2 bg-gray-800 rounded-md">❤️ Sugestões de Prompt</button>
            
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-gray-800 rounded-md">Perguntar</button>
              <button className="px-3 py-2 bg-blue-700 rounded-md">Começar a Ouvir</button>
            </div>
          </div>

        </div>
      </Draggable>
    </div>
  );
}

