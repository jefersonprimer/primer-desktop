/**
 * Event Parser Service
 * 
 * Parses natural language text to extract calendar event intents
 * and calculates confidence scores for the hybrid execution model.
 */

import type {
    ActionPlan,
    CalendarEventDraft,
    ConfirmationReason
} from '@/types/calendar';

// Patterns for detecting event creation intent
// These detect when the AI is CONFIRMING it will create an event
const EVENT_CREATION_PATTERNS = [
    // Direct creation statements
    /(?:create|schedule|add|set up|book|make)\s+(?:a\s+)?(?:meeting|event|appointment|call|reminder)/i,
    /(?:I'll|let me|I will|I'm going to|I am going to)\s+(?:create|schedule|add|set up)\s+(?:a\s+)?(?:meeting|event)/i,
    /(?:scheduling|creating|adding|setting up|booking)\s+(?:a\s+)?(?:meeting|event)/i,

    // AI offering to help with specific action
    /(?:I can|I could|I'd be happy to)\s+(?:help you\s+)?(?:create|schedule|add|set up|book)\s+(?:a\s+)?(?:meeting|event)/i,

    // Confirmation phrases
    /(?:event|meeting)\s+(?:has been|is|was)\s+(?:created|scheduled|added|booked)/i,
    /(?:I've|I have)\s+(?:created|scheduled|added|set up|booked)\s+(?:a\s+)?(?:meeting|event)/i,

    // Request parsing - when user asks to create
    /(?:agendar|criar|marcar)\s+(?:uma?\s+)?(?:reunião|evento|compromisso)/i, // Portuguese
];

// Patterns for extracting time components
const TIME_PATTERNS = {
    // Exact times: "at 2 PM", "at 14:00", "at 2:30pm"
    exactTime: /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i,

    // Relative dates: "tomorrow", "today", "next monday"
    tomorrow: /\btomorrow\b/i,
    today: /\btoday\b/i,
    nextDay: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    thisDay: /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,

    // Ambiguous patterns (lower confidence)
    afternoon: /\b(afternoon|evening|morning|night)\b/i,
    nextWeek: /\bnext\s+week\b/i,
    sometime: /\b(sometime|later|soon)\b/i,
};

// Duration patterns
const DURATION_PATTERNS = {
    explicit: /(?:for\s+)?(\d+)\s*(hour|hr|minute|min)s?/i,
    range: /(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
};

/**
 * Parse text to extract calendar event intent
 */
export function parseEventIntent(text: string, currentTime: Date = new Date()): ActionPlan | null {
    console.log('[EventParser] Processing text:', text.substring(0, 100) + '...');

    // Check if text contains event creation intent
    const matchedPattern = EVENT_CREATION_PATTERNS.find(pattern => pattern.test(text));
    const hasEventIntent = matchedPattern !== undefined;

    console.log('[EventParser] Has event intent:', hasEventIntent);
    if (matchedPattern) {
        console.log('[EventParser] Matched pattern:', matchedPattern.toString());
    }

    if (!hasEventIntent) {
        console.log('[EventParser] No event intent detected, returning null');
        return null;
    }

    // Extract event details
    const draft = extractEventDraft(text, currentTime);

    if (!draft) {
        console.log('[EventParser] Could not extract event draft');
        return null;
    }

    console.log('[EventParser] Extracted draft:', draft);

    // Calculate confidence
    const { score, reasons } = calculateConfidence(draft, text);

    console.log('[EventParser] Confidence score:', score, 'Reasons:', reasons);
    console.log('[EventParser] Requires confirmation:', score < 0.7);

    return {
        action: 'create_event',
        payload: draft,
        requiresConfirmation: score < 0.7, // Threshold for auto-execution
        confidenceScore: score,
        reason: reasons[0], // Primary reason if any
    };
}

/**
 * Extract event draft from text
 */
function extractEventDraft(text: string, currentTime: Date): CalendarEventDraft | null {
    // Extract title (text after event keyword, before time indicators)
    const titleMatch = text.match(/(?:meeting|event|appointment|call|reminder)\s+(?:called\s+|named\s+|titled\s+)?["']?([^"'\n,]+?)["']?\s*(?:at|on|for|tomorrow|today|next|$)/i);
    let title = titleMatch?.[1]?.trim() || 'New Event';

    // Clean up title
    title = title.replace(/\s+(?:at|on|for)$/, '').trim();
    if (title.length < 2) title = 'New Event';

    // Extract date
    const eventDate = extractDate(text, currentTime);

    // Extract time
    const eventTime = extractTime(text);

    // Combine date and time
    let startAt = new Date(eventDate);
    if (eventTime) {
        startAt.setHours(eventTime.hours, eventTime.minutes, 0, 0);
    } else {
        // Default to 9 AM if no time specified
        startAt.setHours(9, 0, 0, 0);
    }

    // Extract or calculate duration
    const duration = extractDuration(text);
    const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

    // Extract description (any additional context)
    const description = extractDescription(text);

    return {
        title,
        description,
        startAt,
        endAt,
        source: 'chat',
    };
}

/**
 * Extract date from text
 */
function extractDate(text: string, currentTime: Date): Date {
    const result = new Date(currentTime);

    if (TIME_PATTERNS.tomorrow.test(text)) {
        result.setDate(result.getDate() + 1);
        return result;
    }

    if (TIME_PATTERNS.today.test(text)) {
        return result;
    }

    const nextDayMatch = text.match(TIME_PATTERNS.nextDay);
    if (nextDayMatch) {
        const targetDay = getDayNumber(nextDayMatch[1]);
        const currentDay = result.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        result.setDate(result.getDate() + daysToAdd);
        return result;
    }

    const thisDayMatch = text.match(TIME_PATTERNS.thisDay);
    if (thisDayMatch) {
        const targetDay = getDayNumber(thisDayMatch[1]);
        const currentDay = result.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        result.setDate(result.getDate() + daysToAdd);
        return result;
    }

    if (TIME_PATTERNS.nextWeek.test(text)) {
        result.setDate(result.getDate() + 7);
        return result;
    }

    // Default to tomorrow if no clear date
    result.setDate(result.getDate() + 1);
    return result;
}

/**
 * Extract time from text
 */
function extractTime(text: string): { hours: number; minutes: number } | null {
    const timeMatch = text.match(TIME_PATTERNS.exactTime);

    if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const period = timeMatch[3]?.toLowerCase();

        // Convert to 24-hour format
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;

        return { hours, minutes };
    }

    // Handle morning/afternoon/evening
    if (TIME_PATTERNS.afternoon.test(text)) {
        const match = text.match(TIME_PATTERNS.afternoon);
        const period = match?.[1]?.toLowerCase();

        switch (period) {
            case 'morning': return { hours: 9, minutes: 0 };
            case 'afternoon': return { hours: 14, minutes: 0 };
            case 'evening': return { hours: 18, minutes: 0 };
            case 'night': return { hours: 20, minutes: 0 };
        }
    }

    return null;
}

/**
 * Extract duration from text
 */
function extractDuration(text: string): number {
    const durationMatch = text.match(DURATION_PATTERNS.explicit);

    if (durationMatch) {
        const value = parseInt(durationMatch[1], 10);
        const unit = durationMatch[2].toLowerCase();

        if (unit.startsWith('hour') || unit.startsWith('hr')) {
            return value * 60;
        }
        return value; // minutes
    }

    // Default to 1 hour
    return 60;
}

/**
 * Extract description from text
 */
function extractDescription(text: string): string | undefined {
    // Look for description indicators
    const descMatch = text.match(/(?:about|regarding|to discuss|for)\s+(.+?)(?:\.|$)/i);
    return descMatch?.[1]?.trim();
}

/**
 * Calculate confidence score for an event draft
 */
function calculateConfidence(
    draft: CalendarEventDraft,
    originalText: string
): { score: number; reasons: ConfirmationReason[] } {
    let score = 1.0;
    const reasons: ConfirmationReason[] = [];

    // Check for exact time specification
    const hasExactTime = TIME_PATTERNS.exactTime.test(originalText);
    if (!hasExactTime) {
        score -= 0.2;
        reasons.push('ambiguous_time');
    }

    // Check for ambiguous time words
    if (TIME_PATTERNS.afternoon.test(originalText) ||
        TIME_PATTERNS.sometime.test(originalText)) {
        score -= 0.15;
        if (!reasons.includes('ambiguous_time')) {
            reasons.push('ambiguous_time');
        }
    }

    // Check for "next week" without specific day
    if (TIME_PATTERNS.nextWeek.test(originalText) &&
        !TIME_PATTERNS.nextDay.test(originalText)) {
        score -= 0.25;
        reasons.push('ambiguous_time');
    }

    // Check duration - very long events are suspicious
    const durationMinutes = (draft.endAt.getTime() - draft.startAt.getTime()) / (1000 * 60);
    if (durationMinutes > 240) { // More than 4 hours
        score -= 0.1;
        reasons.push('long_duration');
    }

    // Check for recurring patterns
    if (/\b(every|weekly|daily|monthly|recurring)\b/i.test(originalText)) {
        score -= 0.3;
        reasons.push('recurring');
    }

    // Check for guests/attendees
    if (/\b(with|invite|attendees?|guests?|team)\b/i.test(originalText)) {
        score -= 0.15;
        reasons.push('multiple_guests');
    }

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));

    return { score, reasons };
}

/**
 * Get day number from day name
 */
function getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
    };
    return days[dayName.toLowerCase()] ?? 0;
}

/**
 * Format a date for display
 */
export function formatEventDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format a time for display
 */
export function formatEventTime(date: Date): string {
    return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format a date range for display
 */
export function formatEventRange(start: Date, end: Date): string {
    const startDate = formatEventDate(start);
    const startTime = formatEventTime(start);
    const endTime = formatEventTime(end);

    return `${startDate} · ${startTime} - ${endTime}`;
}
