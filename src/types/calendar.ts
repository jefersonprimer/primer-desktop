/**
 * Calendar Preview Types
 * 
 * Types for the hybrid execution model that decides between
 * direct event creation vs. preview confirmation.
 */

/**
 * Draft event data before confirmation
 */
export interface CalendarEventDraft {
    title: string;
    description?: string;
    startAt: Date;
    endAt: Date;
    source?: 'voice' | 'chat' | 'manual';
}

/**
 * Reasons why an event might require confirmation
 */
export type ConfirmationReason =
    | 'ambiguous_time'      // "afternoon", "next week"
    | 'missing_fields'      // No end time specified
    | 'multiple_guests'     // Complex event with attendees
    | 'first_use'           // User hasn't created events before
    | 'long_duration'       // Events longer than 4 hours
    | 'recurring';          // Recurring event pattern detected

/**
 * Action plan returned by the event parser
 */
export interface ActionPlan {
    action: 'create_event' | 'update_event' | 'delete_event';
    payload: CalendarEventDraft;
    requiresConfirmation: boolean;
    confidenceScore: number; // 0.0 - 1.0
    reason?: ConfirmationReason;
}

/**
 * Recently created event for undo functionality
 */
export interface RecentlyCreatedEvent {
    id: string;
    googleEventId: string;
    title: string;
    createdAt: number; // timestamp
    expiresAt: number; // timestamp when undo expires
}

/**
 * State for the calendar preview context
 */
export interface CalendarPreviewState {
    draft: CalendarEventDraft | null;
    isPreviewVisible: boolean;
    isCreating: boolean;
    recentlyCreated: RecentlyCreatedEvent | null;
    error: string | null;
}
