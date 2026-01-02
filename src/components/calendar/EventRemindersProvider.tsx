/**
 * Event Reminders Provider
 * 
 * Wrapper component that activates the event reminder system.
 * Must be placed inside NotificationProvider and AuthProvider.
 */

import { type ReactNode } from 'react';
import { useEventReminders } from '@/hooks/useEventReminders';

function EventRemindersActivator() {
    useEventReminders();
    return null;
}

export function EventRemindersProvider({ children }: { children: ReactNode }) {
    return (
        <>
            <EventRemindersActivator />
            {children}
        </>
    );
}
