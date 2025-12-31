import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import CheckIcon from "@/components/ui/icons/CheckIcon";
import { useAuth } from "../../../contexts/AuthContext";

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

    useEffect(() => {
        checkStatus();

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
        if (!userId) return;
        try {
            const result = await invoke<NotionStatus>("get_notion_status", { userId });
            setStatus(result);
        } catch (error) {
            console.error("Failed to get Notion status:", error);
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

    const openPage = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8 relative overflow-y-auto">
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
                {!status.is_connected ? (
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
                                <p className="text-sm text-gray-500 dark:text-neutral-400">Loading pages...</p>
                            </div>
                        ) : pages.length > 0 ? (
                            <div className="grid gap-3">
                                {pages.map((page) => (
                                    <div 
                                        key={page.id} 
                                        onClick={() => openPage(page.url)}
                                        className="group relative p-4 bg-gray-50 dark:bg-[#242425] rounded-xl border border-gray-200 dark:border-transparent flex justify-between items-center transition-all hover:border-neutral-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2c]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-[#1D1D1F] rounded-lg border border-gray-200 dark:border-neutral-800">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
                                                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{page.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-neutral-500">
                                                    Last edited: {new Date(page.last_edited_time).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-[#242425] rounded-xl border border-gray-200 dark:border-transparent border-dashed gap-3">
                                <div className="p-3 bg-gray-100 dark:bg-[#2c2c2e] rounded-full">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                                        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M9 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>
    );
}
