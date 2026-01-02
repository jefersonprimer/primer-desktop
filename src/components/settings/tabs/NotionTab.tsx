import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

import { useAuth } from "../../../contexts/AuthContext";

import CheckIcon from "@/components/ui/icons/CheckIcon";
import EditNoteModal from "@/components/notion/EditNoteModal";

interface NotionStatus {
    is_connected: boolean;
    workspace_name?: string;
}

interface NotionPage {
    id: string;
    title: string;
    url: string;
    last_edited_time: string;
}

export default function NotionTab() {
    const { t } = useTranslation();
    const { userId } = useAuth();
    const [status, setStatus] = useState<NotionStatus>({ is_connected: false });
    const [pages, setPages] = useState<NotionPage[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagesLoading, setPagesLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [editingPage, setEditingPage] = useState<NotionPage | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        checkStatus();
    }, [userId]);

    useEffect(() => {
        if (status.is_connected && userId) {
            fetchPages();
        }
    }, [userId, status.is_connected]);

    useEffect(() => {
        const handleFocus = () => {
            checkStatus();
            if (status.is_connected && userId) {
                fetchPages();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [userId, status.is_connected]);

    const checkStatus = async () => {
        if (!userId) {
            setIsCheckingStatus(false);
            return;
        }
        try {
            const result = await invoke<NotionStatus>("get_notion_status", { userId });
            setStatus(result);
            if (result.is_connected) {
                setPagesLoading(true);
            }
        } catch (error) {
            console.error("Failed to get Notion status:", error);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const fetchPages = async () => {
        if (!userId) return;
        setPagesLoading(true);
        try {
            const results = await invoke<NotionPage[]>("get_notion_pages", { userId });
            setPages(results);
        } catch (error) {
            console.error("Failed to fetch Notion pages:", error);
        } finally {
            setPagesLoading(false);
        }
    };

    const deletePage = async (pageId: string) => {
        if (!userId) return;
        try {
            await invoke("delete_notion_page", { userId, pageId });
            setPages(prev => prev.filter(p => p.id !== pageId));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Failed to delete Notion page:", error);
            alert(t('common.error', 'An error occurred while deleting the note.'));
        }
    };

    const updatePage = async (pageId: string, title: string, content: string) => {
        if (!userId) return;
        setIsSaving(true);
        try {
            await invoke("update_notion_page", { userId, pageId, title, content });
            // Update local state
            setPages(prev => prev.map(p => p.id === pageId ? { ...p, title } : p));
            setEditingPage(null);
        } catch (error) {
            console.error("Failed to update Notion page:", error);
            alert(t('common.error', 'An error occurred while updating the note.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            const url = await invoke<string>("get_notion_auth_url");
            window.location.href = url;
        } catch (error) {
            console.error("Failed to initiate connection:", error);
        } finally {
            setLoading(false);
        }
    };

    const openPage = async (url: string) => {
        try {
            await open(url);
        } catch (error) {
            console.error("Failed to open URL:", error);
        }
    };

    return (
      <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8 relative overflow-y-auto">
        {confirmDeleteId && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200 rounded-xl">
                <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-xs transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                    <div className="text-center mb-6">
                        <h3 className="text-white font-semibold text-lg mb-2">
                            {t('notion.deletePage', 'Delete Note')}
                        </h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                            {t('notion.deletePageWarning', 'Are you sure you want to delete this note? This action cannot be undone.')}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => deletePage(confirmDeleteId)}
                            className="w-full py-3 px-4 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                        >
                            {t('history.delete')}
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="w-full py-3 px-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                        >
                            {t('history.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-neutral-900 dark:text-white text-lg font-semibold">{t("notion.title")}</h2>
                <p className="text-neutral-500 dark:text-gray-400 text-sm">{t("notion.subtitle")}</p>
            </div>
            <div className="flex items-center">
                {status.is_connected ? (
                    <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
                        <CheckIcon size={16} color="#22c55e" />
                        {status.workspace_name || t("notion.active")}
                    </span>
                ) : null}
            </div>
        </div>

        <div className="mt-6">
            {isCheckingStatus ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <div className="w-6 h-6 border-2 border-gray-200 dark:border-white/20 border-t-gray-800 dark:border-t-white rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-neutral-400">Loading...</p>
                </div>
            ) : !status.is_connected ? (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-900 dark:text-white">
                        {t("notion.description")}
                    </p>
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="flex items-center w-fit gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Loading..." : t("notion.connect")}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {pagesLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <div className="w-6 h-6 border-2 border-gray-200 dark:border-white/20 border-t-gray-800 dark:border-t-white rounded-full animate-spin" />
                            <p className="text-sm text-gray-500 dark:text-neutral-400">Loading...</p>
                        </div>
                    ) : pages.length > 0 ? (
                        <div className="grid gap-3">
                            {pages.map((page) => (
                                <div
                                    key={page.id}
                                    className="group relative p-4 bg-gray-50 dark:bg-[#242425] rounded-xl border border-gray-200 dark:border-transparent flex justify-between items-center transition-all hover:border-neutral-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2c]"
                                >
                                    <div className="flex items-center gap-3 flex-1" onClick={() => openPage(page.url)}>
                                        <div className="p-2 bg-white dark:bg-[#1D1D1F] rounded-lg border border-gray-200 dark:border-neutral-800">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
                                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{page.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-neutral-500">
                                                Last edited: {new Date(page.last_edited_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Edit button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingPage(page); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-blue-400"
                                            title={t('calendarPreview.edit', 'Edit')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                <path d="m15 5 4 4" />
                                            </svg>
                                        </button>
                                        {/* Open in Notion button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openPage(page.url); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-white"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </button>
                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(page.id); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-400"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-[#242425] rounded-xl border border-gray-200 dark:border-transparent border-dashed gap-3">
                            <div className="p-3 bg-gray-100 dark:bg-[#2c2c2e] rounded-full">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-900 dark:text-white font-medium text-sm">{t("notion.noPages", "No notes found")}</p>
                                <p className="text-gray-500 dark:text-neutral-400 text-xs mt-1 max-w-[200px]">
                                    {t("notion.askAi", "Ask the AI to create new notes in your Notion workspace.")}
                                </p>
                            </div>
                            <button
                                onClick={fetchPages}
                                className="mt-2 text-xs text-blue-500 hover:text-blue-400 font-medium"
                            >
                                Refresh
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Edit Note Modal */}
        <EditNoteModal
            page={editingPage}
            userId={userId}
            isOpen={editingPage !== null}
            onClose={() => setEditingPage(null)}
            onSave={updatePage}
            isSaving={isSaving}
        />
    </div>
  );
}
