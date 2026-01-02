/**
 * Edit Event Modal
 * 
 * Modal for editing existing calendar events.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent } from '@/services/calendarService';

interface Props {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventId: string, data: {
        title: string;
        description?: string;
        start_at: string;
        end_at: string;
    }) => Promise<void>;
    isSaving?: boolean;
}

export default function EditEventModal({ event, isOpen, onClose, onSave, isSaving }: Props) {
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Sync form with event when it changes
    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setDescription(event.description || '');

            const start = new Date(event.start_at);
            const end = new Date(event.end_at);

            setDate(formatDateForInput(start));
            setStartTime(formatTimeForInput(start));
            setEndTime(formatTimeForInput(end));
        }
    }, [event]);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse date and times back into ISO strings
        const [year, month, day] = date.split('-').map(Number);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startAt = new Date(year, month - 1, day, startHour, startMin);
        let endAt = new Date(year, month - 1, day, endHour, endMin);

        // If end is before start, assume next day
        if (endAt <= startAt) {
            endAt.setDate(endAt.getDate() + 1);
        }

        await onSave(event.id, {
            title,
            description: description || undefined,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                        {t('calendarPreview.editEvent', 'Edit Event')}
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
                            {t('calendarPreview.title', 'Title')}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">
                            {t('calendarPreview.date', 'Date')}
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 [color-scheme:dark]"
                        />
                    </div>

                    {/* Time Range */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">
                                {t('calendarPreview.startTime', 'Start')}
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 [color-scheme:dark]"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">
                                {t('calendarPreview.endTime', 'End')}
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">
                            {t('calendarPreview.description', 'Description')}
                            <span className="text-gray-500 ml-1">({t('common.optional', 'optional')})</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 resize-none"
                            placeholder={t('calendarPreview.descriptionPlaceholder', 'Add a description...')}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
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

function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
