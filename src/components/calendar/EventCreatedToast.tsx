/**
 * Event Created Toast
 * 
 * Toast notification shown after direct event creation.
 * Includes undo functionality with a countdown timer.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendarPreview } from '@/contexts/CalendarPreviewContext';
import CalendarIcon from '@/components/ui/icons/CalendarIcon';

const UNDO_TIMEOUT_MS = 8000;

export default function EventCreatedToast() {
    const { t } = useTranslation();
    const { recentlyCreated, undoRecentEvent } = useCalendarPreview();
    const [timeLeft, setTimeLeft] = useState(UNDO_TIMEOUT_MS);
    const [isUndoing, setIsUndoing] = useState(false);

    useEffect(() => {
        if (!recentlyCreated) {
            return;
        }

        setTimeLeft(recentlyCreated.expiresAt - Date.now());

        const interval = setInterval(() => {
            const remaining = recentlyCreated.expiresAt - Date.now();
            if (remaining <= 0) {
                clearInterval(interval);
                setTimeLeft(0);
            } else {
                setTimeLeft(remaining);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [recentlyCreated]);

    if (!recentlyCreated || timeLeft <= 0) {
        return null;
    }

    const handleUndo = async () => {
        setIsUndoing(true);
        try {
            await undoRecentEvent();
        } finally {
            setIsUndoing(false);
        }
    };

    const progress = (timeLeft / UNDO_TIMEOUT_MS) * 100;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[320px]">
                {/* Progress bar */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />

                <div className="p-4">
                    <div className="flex items-center gap-3">
                        {/* Success icon */}
                        <div className="flex-shrink-0 p-2 bg-green-500/20 rounded-full">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-green-400"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={14} className="text-gray-400" />
                                <span className="text-sm font-medium text-white truncate">
                                    {t('calendarPreview.eventCreated', 'Event created')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                {recentlyCreated.title}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleUndo}
                                disabled={isUndoing}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                            >
                                {isUndoing ? (
                                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                    t('calendarPreview.undo', 'Undo')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
