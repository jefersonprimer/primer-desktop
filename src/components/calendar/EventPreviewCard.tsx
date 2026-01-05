/**
 * Event Preview Card
 * 
 * Shows a parsed event draft with edit/confirm/cancel actions.
 * Used when confidence is low and user confirmation is needed.
 * Supports editing title, date, time, duration, and description.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendarPreview } from '@/contexts/CalendarPreviewContext';
import { formatEventRange } from '@/services/eventParser';
import CalendarIcon from '@/components/ui/icons/CalendarIcon';

export default function EventPreviewCard() {
    const { t } = useTranslation();
    const {
        draft,
        isPreviewVisible,
        isCreating,
        confirmEvent,
        hidePreview,
        updateDraft
    } = useCalendarPreview();

    const [isEditMode, setIsEditMode] = useState(false);

    // Edit form state
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Sync form state with draft when it changes
    useEffect(() => {
        if (draft) {
            setEditTitle(draft.title);
            setEditDate(formatDateForInput(draft.startAt));
            setEditStartTime(formatTimeForInput(draft.startAt));
            setEditEndTime(formatTimeForInput(draft.endAt));
            setEditDescription(draft.description || '');
        }
    }, [draft]);

    if (!isPreviewVisible || !draft) {
        return null;
    }

    const handleEnterEditMode = () => {
        setIsEditMode(true);
    };

    const handleSaveEdit = () => {
        // Parse date and times back into Date objects
        const [year, month, day] = editDate.split('-').map(Number);
        const [startHour, startMin] = editStartTime.split(':').map(Number);
        const [endHour, endMin] = editEndTime.split(':').map(Number);

        const newStartAt = new Date(year, month - 1, day, startHour, startMin);
        const newEndAt = new Date(year, month - 1, day, endHour, endMin);

        // If end time is before start, assume next day
        if (newEndAt <= newStartAt) {
            newEndAt.setDate(newEndAt.getDate() + 1);
        }

        updateDraft({
            title: editTitle,
            startAt: newStartAt,
            endAt: newEndAt,
            description: editDescription || undefined,
        });

        setIsEditMode(false);
    };

    const handleCancelEdit = () => {
        // Reset form to draft values
        if (draft) {
            setEditTitle(draft.title);
            setEditDate(formatDateForInput(draft.startAt));
            setEditStartTime(formatTimeForInput(draft.startAt));
            setEditEndTime(formatTimeForInput(draft.endAt));
            setEditDescription(draft.description || '');
        }
        setIsEditMode(false);
    };

    const handleConfirm = async () => {
        await confirmEvent();
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 my-3">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <CalendarIcon size={16} className="text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                        {isEditMode
                            ? t('calendarPreview.editEvent', 'Edit Event')
                            : t('calendarPreview.previewTitle', 'Schedule this event?')}
                    </span>
                </div>

                {isEditMode ? (
                    /* Edit Mode Form */
                    <div className="space-y-3">
                        {/* Title */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                {t('calendarPreview.title', 'Title')}
                            </label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                                placeholder="Event title"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                {t('calendarPreview.date', 'Date')}
                            </label>
                            <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
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
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 [color-scheme:dark]"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">
                                    {t('calendarPreview.endTime', 'End')}
                                </label>
                                <input
                                    type="time"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
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
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 resize-none"
                                placeholder={t('calendarPreview.descriptionPlaceholder', 'Add a description...')}
                            />
                        </div>

                        {/* Edit Mode Actions */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
                            >
                                {t('calendarPreview.saveChanges', 'Save Changes')}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition"
                            >
                                {t('calendarPreview.cancel', 'Cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Preview Mode */
                    <>
                        <div className="space-y-2">
                            {/* Title */}
                            <h3 className="text-lg font-semibold text-white">
                                {draft.title}
                            </h3>

                            {/* Date/Time */}
                            <p className="text-sm text-gray-300">
                                {formatEventRange(draft.startAt, draft.endAt)}
                            </p>

                            {/* Description */}
                            {draft.description && (
                                <p className="text-sm text-gray-400 mt-1">{draft.description}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                onClick={handleConfirm}
                                disabled={isCreating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white text-sm font-medium rounded-lg transition active:scale-[0.98]"
                            >
                                {isCreating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t('calendarPreview.creating', 'Creating...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        <span>{t('calendarPreview.confirm', 'Confirm')}</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleEnterEditMode}
                                disabled={isCreating}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                            >
                                {t('calendarPreview.edit', 'Edit')}
                            </button>

                            <button
                                onClick={hidePreview}
                                disabled={isCreating}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 text-sm font-medium rounded-lg transition"
                            >
                                {t('calendarPreview.cancel', 'Cancel')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time for HTML time input (HH:MM)
 */
function formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

