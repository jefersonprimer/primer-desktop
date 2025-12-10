import { useEffect } from "react";
import ChatHistory from "./ChatHistory";

interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  selected: ChatSession | null;
  onSelect: (session: ChatSession) => void;
  messages: ChatMessage[];
  onLoadMessages: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onDeleteAll: () => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  sessions,
  selected,
  onSelect,
  messages,
  onLoadMessages,
  onDelete,
  onDeleteAll,
}: HistoryModalProps) {

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="relative w-full max-w-[900px] bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl flex h-[80vh]">

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-300 hover:text-white z-10"
        >
          ✕
        </button>

        {/* Sidebar esquerda */}
        <aside className="w-80 bg-neutral-950 border-r border-neutral-700 flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
             <h2 className="text-xl text-white font-semibold">
              Histórico
            </h2>
            {sessions.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm("Tem certeza que deseja apagar todo o histórico?")) {
                    onDeleteAll();
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline"
              >
                Limpar tudo
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sessions.length === 0 && (
              <p className="text-neutral-500 text-sm text-center mt-10">Nenhuma sessão encontrada.</p>
            )}

            {sessions.map((s) => (
              <div 
                 key={s.id}
                 className={`group relative w-full rounded-lg border transition flex items-center
                  ${
                    selected?.id === s.id
                      ? "bg-neutral-800 border-neutral-600"
                      : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                  }`}
              >
                <button
                  onClick={() => {
                    onSelect(s);
                    onLoadMessages(s.id); 
                  }}
                  className="flex-1 text-left p-3 pr-10"
                >
                  <div className="text-white font-medium truncate">{s.title}</div>
                  <div className="text-neutral-400 text-sm">{s.model}</div>
                  <div className="text-neutral-500 text-xs">{s.createdAt}</div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Apagar esta conversa?")) {
                      onDelete(s.id);
                    }
                  }}
                  className="absolute right-2 p-2 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  title="Apagar conversa"
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
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Área direita */}
        <main className="flex-1 p-6 text-neutral-300 overflow-hidden flex flex-col">

          {!selected && (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-center">
              <div>
                <div className="text-4xl mb-4">👉</div>
                <p>Selecione uma sessão para ver os detalhes.</p>
              </div>
            </div>
          )}

          {selected && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-2xl font-semibold text-white mb-4 flex justify-between items-center">
                <span>{selected.title}</span>
              </h3>

              {/* Container do chat */}
              <div className="flex-1 border border-neutral-700 rounded-xl p-4 bg-neutral-950 overflow-hidden">
                <ChatHistory messages={messages} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

