/**
 * Edit Note Modal
 * 
 * Modal for editing Notion page title and content.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

interface NotionPage {
    id: string;
    title: string;
    url: string;
    last_edited_time: string;
}

interface Props {
    page: NotionPage | null;
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (pageId: string, title: string, content: string) => Promise<void>;
    isSaving?: boolean;
}

export default function EditNoteModal({ page, userId, isOpen, onClose, onSave, isSaving }: Props) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    // Sync form with page when it changes and fetch content
    useEffect(() => {
        if (page && userId && isOpen) {
            setTitle(page.title);
            setContent(''); // Reset while loading
            setIsLoadingContent(true);

            invoke<string>('get_notion_page_content', { userId, pageId: page.id })
                .then((pageContent) => {
                    setContent(pageContent);
                })
                .catch((err) => {
                    console.error('Failed to fetch page content:', err);
                    setContent('');
                })
                .finally(() => {
                    setIsLoadingContent(false);
                });
        }
    }, [page, userId, isOpen]);

    if (!isOpen || !page) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onSave(page.id, title.trim(), content);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                        {t('notion.editNote', 'Edit Note')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">
                            {t('notion.noteTitle', 'Title')}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                            placeholder={t('notion.enterTitle', 'Enter note title...')}
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">
                            {t('notion.noteContent', 'Content')}
                        </label>
                        {isLoadingContent ? (
                            <div className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-4 text-gray-500 text-sm flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                {t('common.loading', 'Loading...')}
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 resize-none"
                                placeholder={t('notion.enterContent', 'Enter note content...')}
                            />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSaving || !title.trim() || isLoadingContent}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white text-sm font-medium rounded-lg transition"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{t('common.saving', 'Saving...')}</span>
                                </>
                            ) : (
                                <span>{t('calendarPreview.saveChanges', 'Save Changes')}</span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                        >
                            {t('calendarPreview.cancel', 'Cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
