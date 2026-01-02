/**
 * useCalendarEventHandler Hook
 * 
 * Handles the detection and processing of calendar event intents from AI responses.
 * Implements the hybrid execution model - direct execution for high confidence,
 * preview for low confidence.
 */

import { useCallback } from 'react';
import { useCalendarPreview } from '@/contexts/CalendarPreviewContext';
import { parseEventIntent } from '@/services/eventParser';
import type { CalendarEventDraft } from '@/types/calendar';

interface UseCalendarEventHandlerOptions {
    onEventDetected?: (draft: CalendarEventDraft, requiresConfirmation: boolean) => void;
}

export function useCalendarEventHandler(options: UseCalendarEventHandlerOptions = {}) {
    const {
        showPreview,
        createEventDirect,
        isCreating,
        recentlyCreated
    } = useCalendarPreview();

    /**
     * Process text from AI response to detect and handle event creation intents
     */
    const processAiResponse = useCallback((text: string): boolean => {
        // Parse the text for event intents
        const actionPlan = parseEventIntent(text);

        if (!actionPlan) {
            return false; // No event intent detected
        }

        const { payload, requiresConfirmation, confidenceScore } = actionPlan;

        // Notify callback if provided
        if (options.onEventDetected) {
            options.onEventDetected(payload, requiresConfirmation);
        }

        if (requiresConfirmation) {
            // Low confidence - show preview for user confirmation
            console.log(`[CalendarHandler] Low confidence (${confidenceScore.toFixed(2)}), showing preview`);
            showPreview(payload);
        } else {
            // High confidence - execute directly
            console.log(`[CalendarHandler] High confidence (${confidenceScore.toFixed(2)}), executing directly`);
            createEventDirect(payload);
        }

        return true; // Event intent was detected and handled
    }, [showPreview, createEventDirect, options]);

    /**
     * Manually trigger preview mode with a given draft
     */
    const showEventPreview = useCallback((draft: CalendarEventDraft) => {
        showPreview(draft);
    }, [showPreview]);

    /**
     * Check if there's an active event creation in progress
     */
    const hasRecentEvent = recentlyCreated !== null;

    return {
        processAiResponse,
        showEventPreview,
        isCreating,
        hasRecentEvent,
    };
}
