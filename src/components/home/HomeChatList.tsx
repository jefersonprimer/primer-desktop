import { useTranslation } from "react-i18next";
import React from "react";

interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: Date;
}

interface HomeChatListProps {
  sessions: ChatSession[];
  onSelect: (session: ChatSession) => void;
}

export default function HomeChatList({ sessions, onSelect }: HomeChatListProps) {
  const { t } = useTranslation();

  const renderList = () => {
    const listItems: React.ReactElement[] = [];
    let lastDateKey = "";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    sessions.forEach((session) => {
      const date = session.createdAt;
      let key = date.toLocaleDateString();
      if (date.toDateString() === today.toDateString()) {
        key = t('date.today', 'Today');
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = t('date.yesterday', 'Yesterday');
      }

      if (key !== lastDateKey) {
        listItems.push(
          <div key={`header-${key}`} className="text-xs font-semibold text-white/40 uppercase tracking-wider mt-6 mb-2 px-2">
            {key}
          </div>
        );
        lastDateKey = key;
      }

      listItems.push(
        <button
          key={session.id}
          onClick={() => onSelect(session)}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
        >
            <div className="flex flex-col gap-1 min-w-0">
                <span className="text-white/90 font-medium truncate group-hover:text-white transition-colors">{session.title}</span>
                <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{session.model}</span>
            </div>
            <div className="text-xs text-white/30 font-mono whitespace-nowrap ml-4 group-hover:text-white/50 transition-colors">
                {session.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </button>
      );
    });

    return listItems;
  };

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-20 flex items-center justify-center min-h-[200px]">
        <span className="text-white/40 text-sm italic">
          {t('history.noSessions', 'No sessions...')}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
        <div className="flex flex-col">
            {renderList()}
        </div>
    </div>
  );
}
