import { useState } from "react";
import { createPortal } from "react-dom";

interface AssistantItem {
  id: string;
  name: string;
  builtIn?: boolean;
  prompt: string;
}

export default function AssistantsManagerModal({ onClose }: { onClose: () => void; open?: boolean }) {
  const [assistants, setAssistants] = useState<AssistantItem[]>([
    { id: "1", name: "General Assistant", builtIn: true, prompt: "" },
    { id: "2", name: "Sales Assistant", builtIn: true, prompt: "" },
    { id: "3", name: "LeetCode Assistant", builtIn: true, prompt: "" },
    { id: "4", name: "Study Assistant", builtIn: true, prompt: "" },
    { id: "5", name: "Tech Candidate", builtIn: true, prompt: "" }
  ]);

  const [selected, setSelected] = useState<AssistantItem | null>(assistants[0]);

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-[9999]">
      {/* Backdrop overlay to handle click outside if needed */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700"
      >
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-72 border-r border-white/10 bg-neutral-950 p-2 overflow-y-auto">
            {assistants.map(a => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className={`p-3 rounded-lg cursor-pointer transition mb-1 ${
                  selected?.id === a.id ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <p className="text-white text-sm font-medium">{a.name}</p>
                <p className="text-xs text-white/40">{a.builtIn ? "Integrado" : "Custom"}</p>
              </div>
            ))}

            <button className="mt-3 w-full p-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 transition">
              + Criar Novo Assistente
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-white font-semibold">{selected?.name}</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
            </div>

            {/* TABS */}
            <div className="flex gap-3 mb-4 border-b border-white/10 pb-2">
              <button className="px-4 py-1 bg-white/10 rounded-lg text-white text-sm">Sistema</button>
              <button className="px-4 py-1 hover:bg-white/5 rounded-lg text-white/70 text-sm">Acompanhamento</button>
              <button className="px-4 py-1 hover:bg-white/5 rounded-lg text-white/70 text-sm">E-mail</button>
              <button className="px-4 py-1 hover:bg-white/5 rounded-lg text-white/70 text-sm">Conhecimento</button>
            </div>

            {/* PROMPT EDITOR */}
            <textarea
              className="w-full h-80 bg-neutral-950 border border-white/10 rounded-lg p-4 text-white text-sm focus:outline-none resize-none"
              placeholder="# System Prompt\nDescreva o comportamento do assistente aqui..."
              value={selected?.prompt || ""}
              onChange={(e) => {
                if (!selected) return;
                setAssistants(prev => prev.map(a => a.id === selected.id ? { ...a, prompt: e.target.value } : a));
                setSelected({ ...selected, prompt: e.target.value });
              }}
            />

            <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
