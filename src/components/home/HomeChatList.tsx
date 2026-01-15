import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import EllipsisIcon from "@/components/ui/icons/EllipsisIcon";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HomeChatListProps {
  sessions: ChatSession[];
  onSelect: (session: ChatSession) => void;
  onDelete: (sessionId: string) => void;
  onDeleteAll?: () => void;
}

export default function HomeChatList({ sessions, onSelect, onDelete }: HomeChatListProps) {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = async (session: ChatSession) => {
    if (sharingId === session.id) return;

    // Keep menu open to show loading state
    setSharingId(session.id);

    try {
      // 1. Fetch messages
      const res = await invoke<{ messages: any[] }>("get_messages", { dto: { chat_id: session.id } });

      if (!res.messages || res.messages.length === 0) {
        throw new Error('No messages found');
      }

      const messages = res.messages.map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      }));

      // 2. Share API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/chat/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: session.id,
          title: session.title,
          messages: messages,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create share: ${errorText}`);
      }

      const data = await response.json();

      if (!data.shareUrl) {
        throw new Error('No shareUrl in response');
      }

      // 3. Copy using Tauri clipboard (works without user gesture requirement)
      await writeText(data.shareUrl);

      // 4. Show "Copied!" feedback, then close menu after delay
      setSharingId(null);
      setCopiedId(session.id);
      setTimeout(() => {
        setCopiedId(null);
        setActiveMenuId(null);
      }, 1500);
    } catch (e) {
      console.error('[Share] Error:', e);
      setSharingId(null);
      setActiveMenuId(null);
    }
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = Math.max(0, end.getTime() - start.getTime());
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (diff < 60000) return `${seconds}s`;
    if (hours < 1) return `${minutes}m`;
    return `${hours}h ${minutes % 60}m`;
  };

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
        <div
          key={session.id}
          className="relative w-full group"
        >
          <button
            onClick={() => onSelect(session)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex flex-col gap-1 min-w-0 pr-4">
              <span className="text-white/90 font-medium truncate group-hover:text-white transition-colors">{session.title}</span>
              <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{session.model}</span>
            </div>

            <div className="flex items-center justify-end gap-3">
              {/* Duration Badge - Fixed centering with inline-flex and leading-none */}
              <span className="bg-[#121214] h-5 px-2 rounded-full text-xs text-white/30 font-mono whitespace-nowrap group-hover:text-white/50 transition-all inline-flex items-center justify-center leading-none">
                {formatDuration(session.createdAt, session.updatedAt)}
              </span>

              {/* Interaction Container: Time vs Ellipsis */}
              <div className="relative w-14 h-6 flex items-center justify-end">

                {/* Time: Slide Left & Fade Out */}
                <span className={`absolute right-0 text-xs text-white/30 font-mono whitespace-nowrap transition-all duration-300 ease-out leading-none
                    ${activeMenuId === session.id
                    ? '-translate-x-2 opacity-0 pointer-events-none'
                    : 'translate-x-0 opacity-100 group-hover:-translate-x-2 group-hover:opacity-0'}
                  `}>
                  {session.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Ellipsis: Slide In & Fade In */}
                <div className={`absolute right-0 flex items-center justify-end transition-all duration-300 ease-out z-10
                    ${activeMenuId === session.id
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}
                  `}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === session.id ? null : session.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <EllipsisIcon size={18} />
                  </div>
                </div>

                {/* Dropdown Menu */}
                {activeMenuId === session.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}
                    />
                    <div className="absolute right-0 top-8 z-50 min-w-[140px] bg-[#1C1C1E] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(session);
                        }}
                        disabled={sharingId === session.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5 transition-colors text-left"
                      >
                        <span>
                          {sharingId === session.id
                            ? t('common.sharing', 'Sharing...')
                            : copiedId === session.id
                              ? t('common.copied', 'Copied!')
                              : t('common.copyLink', 'Copy link')}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(session.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors text-left"
                      >
                        <span>{t('common.delete', 'Delete')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
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
    <div className="w-full max-w-6xl mx-auto pb-20">
      <div className="flex flex-col">
        {renderList()}
      </div>
    </div>
  );
}
