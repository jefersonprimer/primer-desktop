import { useTranslation } from "react-i18next";
import CalendarIcon from "@/components/ui/icons/CalendarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { calendarService } from "@/services/calendarService";
import type { CalendarEvent } from "@/services/calendarService";
import EditEventModal from "@/components/calendar/EditEventModal";

export default function CalendarTab() {
  const { t } = useTranslation();
  const { userId, isCalendarConnected, isLoading: isAuthLoading, connectGoogleCalendar, disconnectGoogleCalendar } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    if (userId && isCalendarConnected) {
      setIsLoading(true);
      calendarService.getEvents(userId)
        .then((data) => {
          const now = new Date();
          // Filter out past events (events whose end_at is before current time)
          const upcomingEvents = data.filter(event =>
            new Date(event.end_at) > now
          );
          // Sort by start time
          const sortedEvents = [...upcomingEvents].sort((a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          );
          setEvents(sortedEvents);
          setIsSessionExpired(false);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [userId, isCalendarConnected]);

  const handleConnectGoogle = async () => {
    await connectGoogleCalendar();
  };

  const handleDisconnect = async () => {
    await disconnectGoogleCalendar();
    setConfirmDisconnect(false);
    setEvents([]);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!userId) return;
    try {
      await calendarService.deleteEvent(userId, eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setConfirmDeleteId(null);
      setIsSessionExpired(false);
    } catch (error: any) {
      console.error("Failed to delete event", error);
      const errorMsg = String(error);
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("invalid authentication")) {
        setIsSessionExpired(true);
      } else {
        alert(t('common.error'));
      }
    }
  };

  const handleUpdateEvent = async (eventId: string, data: {
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
  }) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const updatedEvent = await calendarService.updateEvent({
        user_id: userId,
        event_id: eventId,
        title: data.title,
        description: data.description,
        start_at: data.start_at,
        end_at: data.end_at,
      });
      // Update the event in the list
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      setEditingEvent(null);
      setIsSessionExpired(false);
    } catch (error: any) {
      console.error("Failed to update event", error);
      const errorMsg = String(error);
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("invalid authentication")) {
        setIsSessionExpired(true);
      } else {
        alert(t('common.error'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8 relative">
      {isSessionExpired && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-500">Session Expired</h3>
              <p className="text-xs text-red-400/80">Your Google connection has expired. Please reconnect to manage events.</p>
            </div>
          </div>
          <button
            onClick={handleConnectGoogle}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Reconnect
          </button>
        </div>
      )}

      {confirmDeleteId && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200 rounded-xl">
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-xs transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <h3 className="text-white font-semibold text-lg mb-2">
                {t('calendar.deleteEvent')}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {t('calendar.deleteEventWarning')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDeleteEvent(confirmDeleteId)}
                className="w-full py-3 px-4 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                {t('history.delete')}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-full py-3 px-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                {t('history.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDisconnect && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200 rounded-xl">
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-xs transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <h3 className="text-white font-semibold text-lg mb-2">
                {t('calendar.disconnect', 'Disconnect Google Calendar')}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {t('calendar.disconnectWarning', 'Are you sure you want to disconnect Google Calendar? You can reconnect at any time.')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDisconnect}
                className="w-full py-3 px-4 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                {t('common.disconnect', 'Disconnect')}
              </button>
              <button
                onClick={() => setConfirmDisconnect(false)}
                className="w-full py-3 px-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                {t('history.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('calendar.title')}</h1>
          <p className="text-sm">
            {t('calendar.description')}
          </p>
        </div>
        {isCalendarConnected && (
          <button
            onClick={() => setConfirmDisconnect(true)}
            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors"
          >
            {t('common.disconnect', 'Disconnect')}
          </button>
        )}
      </div>

      <div className="flex flex-col w-full h-auto overflow-y-auto">
        {(isAuthLoading || isLoading) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-gray-800 dark:border-t-white rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-neutral-400">{t('common.loading', "Loading events...")}</p>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="group relative p-4 bg-gray-50 dark:bg-[#242425] rounded-xl border border-gray-200 dark:border-transparent flex justify-between items-center transition-all hover:border-neutral-700">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {new Date(event.start_at).toLocaleString()} - {new Date(event.end_at).toLocaleTimeString()}
                  </p>
                  {event.description && <p className="text-sm text-gray-400 mt-1">{event.description}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${event.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800'}`}>
                    {event.status}
                  </div>
                  {!event.id.startsWith('default-') && (
                    <>
                      {/* Edit button */}
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="p-2 text-neutral-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition"
                        title={t('calendarPreview.edit', 'Edit')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="p-2 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        title={t('calendar.deleteEvent')}
                      >
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
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isCalendarConnected ? (
          <div className="flex flex-col gap-4">
            <div>
              <CalendarIcon size={20} />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{t('calendar.noEvents')}</h2>
              <p className="text-sm">
                {t('calendar.askToCreate')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <CalendarIcon size={20} />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{t('calendar.noCalendars')}</h2>
              <p className="text-sm">
                {t('calendar.getStarted')}
              </p>
            </div>

            <button
              onClick={handleConnectGoogle}
              className="inline-flex w-fit items-center text-sm font-semibold text-gray-900 dark:text-white hover:text-white gap-2 rounded-lg border border-zinc-700 dark:border-neutral-600 bg-white dark:bg-[#423F44] hover:bg-zinc-700 px-4 py-2 transition"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                className="shrink-0"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19-8.5 19-19 0-1.3-.1-2.6-.4-3.9z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.1H42V20H24v8h11.3c-1.1 2.9-3.1 5.3-5.7 6.9l6.3 5.2C38.9 36.4 43 30.8 43 24c0-1.3-.1-2.6-.4-3.9z"
                />
              </svg>

              {t('calendar.connectGoogle')}
            </button>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        event={editingEvent}
        isOpen={editingEvent !== null}
        onClose={() => setEditingEvent(null)}
        onSave={handleUpdateEvent}
        isSaving={isSaving}
      />
    </div>
  );
}

