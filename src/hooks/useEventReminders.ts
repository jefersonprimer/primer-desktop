/**
 * useEventReminders Hook
 * 
 * Monitors upcoming calendar events and triggers notifications
 * 1 hour before each event starts.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { calendarService, type CalendarEvent } from '@/services/calendarService';

const REMINDER_BEFORE_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const NOTIFICATION_DURATION_MS = 30000; // Show for 30 seconds

export function useEventReminders() {
    const { userId, googleAccessToken } = useAuth();
    const { addNotification } = useNotification();

    // Track which events we've already notified about
    const notifiedEventsRef = useRef<Set<string>>(new Set());

    // Track scheduled timeouts
    const scheduledTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const scheduleReminder = useCallback((event: CalendarEvent) => {
        const eventId = event.id;

        // Skip if already notified or scheduled
        if (notifiedEventsRef.current.has(eventId) || scheduledTimeoutsRef.current.has(eventId)) {
            return;
        }

        const now = Date.now();
        const eventStart = new Date(event.start_at).getTime();
        const reminderTime = eventStart - REMINDER_BEFORE_MS;
        const timeUntilReminder = reminderTime - now;

        // If reminder time has passed but event hasn't started yet, notify immediately
        if (timeUntilReminder <= 0 && eventStart > now) {
            triggerReminder(event);
            return;
        }

        // If reminder is in the future (within 2 hours), schedule it
        if (timeUntilReminder > 0 && timeUntilReminder <= 2 * REMINDER_BEFORE_MS) {
            console.log(`[EventReminders] Scheduling reminder for "${event.title}" in ${Math.round(timeUntilReminder / 60000)} minutes`);

            const timeout = setTimeout(() => {
                triggerReminder(event);
                scheduledTimeoutsRef.current.delete(eventId);
            }, timeUntilReminder);

            scheduledTimeoutsRef.current.set(eventId, timeout);
        }
    }, []);

    const triggerReminder = useCallback((event: CalendarEvent) => {
        const eventId = event.id;

        // Prevent duplicate notifications
        if (notifiedEventsRef.current.has(eventId)) {
            return;
        }

        notifiedEventsRef.current.add(eventId);

        const startTime = new Date(event.start_at);
        const timeString = startTime.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        console.log(`[EventReminders] Triggering reminder for "${event.title}" at ${timeString}`);

        addNotification({
            title: '📅 Upcoming Event',
            message: `"${event.title}" starts at ${timeString}`,
            type: 'info',
            duration: NOTIFICATION_DURATION_MS,
            actions: [
                {
                    label: 'Dismiss',
                    onClick: () => { },
                    variant: 'secondary',
                },
            ],
        });
    }, [addNotification]);

    const checkUpcomingEvents = useCallback(async () => {
        if (!userId || !googleAccessToken) {
            return;
        }

        try {
            const events = await calendarService.getEvents(userId);
            const now = Date.now();
            const twoHoursFromNow = now + 2 * REMINDER_BEFORE_MS;

            // Filter events starting within the next 2 hours
            const upcomingEvents = events.filter(event => {
                const eventStart = new Date(event.start_at).getTime();
                return eventStart > now && eventStart <= twoHoursFromNow;
            });

            // Schedule reminders for each upcoming event
            upcomingEvents.forEach(event => {
                scheduleReminder(event);
            });
        } catch (error) {
            console.error('[EventReminders] Failed to check events:', error);
        }
    }, [userId, googleAccessToken, scheduleReminder]);

    // Initial check and periodic checks
    useEffect(() => {
        if (!userId || !googleAccessToken) {
            return;
        }

        // Check immediately on mount
        checkUpcomingEvents();

        // Set up periodic checks
        const intervalId = setInterval(checkUpcomingEvents, CHECK_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);

            // Clear all scheduled timeouts
            scheduledTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            scheduledTimeoutsRef.current.clear();
        };
    }, [userId, googleAccessToken, checkUpcomingEvents]);

    // Clean up old notified events periodically (events that have started)
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            // This is a simple cleanup - in production you might want to be more sophisticated
            // For now, we just let the Set grow as it's bounded by the user's events
        }, CHECK_INTERVAL_MS * 10);

        return () => clearInterval(cleanupInterval);
    }, []);
}
