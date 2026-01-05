/**
 * Calendar Preview Context
 * 
 * Manages the state for the hybrid calendar preview system,
 * including draft events, preview visibility, and undo functionality.
 */

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    type ReactNode
} from 'react';
import { useAuth } from './AuthContext';
import { calendarService } from '@/services/calendarService';
import type {
    CalendarEventDraft,
    CalendarPreviewState,
    RecentlyCreatedEvent
} from '@/types/calendar';

const UNDO_TIMEOUT_MS = 8000; // 8 seconds to undo

interface CalendarPreviewContextType extends CalendarPreviewState {
    // Preview actions
    showPreview: (draft: CalendarEventDraft) => void;
    hidePreview: () => void;
    updateDraft: (updates: Partial<CalendarEventDraft>) => void;

    // Event actions
    confirmEvent: () => Promise<void>;
    createEventDirect: (draft: CalendarEventDraft) => Promise<void>;
    undoRecentEvent: () => Promise<void>;

    // Reset
    clearError: () => void;
}

const CalendarPreviewContext = createContext<CalendarPreviewContextType | undefined>(undefined);

export function CalendarPreviewProvider({ children }: { children: ReactNode }) {
    const { userId } = useAuth();

    const [draft, setDraft] = useState<CalendarEventDraft | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [recentlyCreated, setRecentlyCreated] = useState<RecentlyCreatedEvent | null>(null);
    const [error, setError] = useState<string | null>(null);

    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Show the preview modal with a draft event
     */
    const showPreview = useCallback((newDraft: CalendarEventDraft) => {
        setDraft(newDraft);
        setIsPreviewVisible(true);
        setError(null);
    }, []);

    /**
     * Hide the preview modal
     */
    const hidePreview = useCallback(() => {
        setIsPreviewVisible(false);
        setDraft(null);
        setError(null);
    }, []);

    /**
     * Update the current draft
     */
    const updateDraft = useCallback((updates: Partial<CalendarEventDraft>) => {
        setDraft(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    /**
     * Clear any error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Create an event directly (high confidence path)
     */
    const createEventDirect = useCallback(async (eventDraft: CalendarEventDraft) => {
        if (!userId) {
            setError('Not authenticated');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const result = await calendarService.createEvent({
                user_id: userId,
                title: eventDraft.title,
                description: eventDraft.description,
                start_at: eventDraft.startAt.toISOString(),
                end_at: eventDraft.endAt.toISOString(),
            });

            // Store for undo functionality
            const now = Date.now();
            const recentEvent: RecentlyCreatedEvent = {
                id: (result as any).event_id,
                googleEventId: (result as any).google_event_id,
                title: eventDraft.title,
                createdAt: now,
                expiresAt: now + UNDO_TIMEOUT_MS,
            };

            setRecentlyCreated(recentEvent);

            // Clear undo option after timeout
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
            undoTimeoutRef.current = setTimeout(() => {
                setRecentlyCreated(null);
            }, UNDO_TIMEOUT_MS);

        } catch (err) {
            console.error('Failed to create event:', err);
            setError(err instanceof Error ? err.message : 'Failed to create event');
        } finally {
            setIsCreating(false);
        }
    }, [userId]);

    /**
     * Confirm and create event from preview
     */
    const confirmEvent = useCallback(async () => {
        if (!draft) {
            setError('No draft to confirm');
            return;
        }

        await createEventDirect(draft);
        hidePreview();
    }, [draft, createEventDirect, hidePreview]);

    /**
     * Undo the recently created event
     */
    const undoRecentEvent = useCallback(async () => {
        if (!recentlyCreated || !userId) {
            return;
        }

        // Clear the timeout
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }

        try {
            await calendarService.deleteEvent(userId, recentlyCreated.id);
            setRecentlyCreated(null);
        } catch (err) {
            console.error('Failed to undo event:', err);
            setError(err instanceof Error ? err.message : 'Failed to undo event');
        }
    }, [recentlyCreated, userId]);

    const value: CalendarPreviewContextType = {
        // State
        draft,
        isPreviewVisible,
        isCreating,
        recentlyCreated,
        error,

        // Actions
        showPreview,
        hidePreview,
        updateDraft,
        confirmEvent,
        createEventDirect,
        undoRecentEvent,
        clearError,
    };

    return (
        <CalendarPreviewContext.Provider value={value}>
            {children}
        </CalendarPreviewContext.Provider>
    );
}

export function useCalendarPreview() {
    const context = useContext(CalendarPreviewContext);
    if (context === undefined) {
        throw new Error('useCalendarPreview must be used within a CalendarPreviewProvider');
    }
    return context;
}
