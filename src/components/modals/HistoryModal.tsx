import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import ChatHistory from "../ChatHistory";
import CloseIcon from "../ui/icons/CloseIcon";

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
  const { t } = useTranslation();

  const [confirmState, setConfirmState] = useState<{
    type: 'single' | 'all';
    id?: string;
  } | null>(null);

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
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[9999]">
      <div className="relative w-full max-w-[900px] bg-[#1D1D1F] text-neutral-300 rounded-xl shadow-xl flex h-[80vh] overflow-hidden">

        {confirmState && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-xs transform transition-all scale-100 animate-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <h3 className="text-white font-semibold text-lg mb-2">
                  {confirmState.type === 'all' ? t('history.clearHistory') : t('history.deleteConversation')}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {confirmState.type === 'all'
                    ? t('history.clearHistoryWarning')
                    : t('history.deleteConversationWarning')}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (confirmState.type === 'all') {
                      onDeleteAll();
                    } else if (confirmState.type === 'single' && confirmState.id) {
                      onDelete(confirmState.id);
                    }
                    setConfirmState(null);
                  }}
                  className="w-full py-3 px-4 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                >
                  {t('history.delete')}
                </button>
                <button
                  onClick={() => setConfirmState(null)}
                  className="w-full py-3 px-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                >
                  {t('history.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}


        <aside className="w-80 bg-[#181719] border-r border-neutral-700 flex flex-col">
          <div className="flex items-center justify-between p-3 shrink-0">
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1 rounded-full transition-colors"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="px-4 py-2 flex justify-between items-center">
            {sessions.length > 0 && (
              <button
                onClick={() => setConfirmState({ type: 'all' })}
                className="text-xs text-red-400 hover:text-red-300 "
              >
                {t('history.clearAll')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sessions.length === 0 && (
              <p className="text-neutral-500 text-sm text-center mt-10">{t('history.noSessions')}</p>
            )}

            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group relative w-full rounded-lg transition flex items-center
                  ${selected?.id === s.id
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
                    setConfirmState({ type: 'single', id: s.id });
                  }}
                  className="absolute right-2 p-2 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  title={t('history.deleteConversationTitle')}
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
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6 text-neutral-300 overflow-y-auto flex flex-col">
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-center">
              <div>
                <div className="text-base mb-4">👉</div>
                <p>{t('history.selectSession')}</p>
              </div>
            </div>
          )}

          {selected && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-base font-semibold text-white mb-4 flex justify-between items-center">
                <span>{selected.title}</span>
              </h3>

              <div className="flex-1  overflow-y-auto">
                <ChatHistory messages={messages} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

