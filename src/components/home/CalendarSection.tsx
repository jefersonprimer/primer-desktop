import { useTranslation } from "react-i18next";
import CalendarIcon from "@/components/ui/icons/CalendarIcon";
import ArrowRightIcon from "@/components/ui/icons/ArrowRightIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { calendarService } from "@/services/calendarService";
import type { CalendarEvent } from "@/services/calendarService";
import EditEventModal from "@/components/calendar/EditEventModal";
import { motion, AnimatePresence } from "framer-motion";

type CalendarFilter = 'today' | 'next_7_days' | 'week' | 'month' | 'all';

interface CalendarSectionProps {
    refreshTrigger?: number;
    compact?: boolean;
}

export default function CalendarSection({ refreshTrigger = 0, compact = false }: CalendarSectionProps) {
    const { t } = useTranslation();
    const { userId, isCalendarConnected, isLoading: isAuthLoading, connectGoogleCalendar } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState<CalendarFilter>('next_7_days');

    useEffect(() => {
        if (userId && isCalendarConnected) {
            setIsLoading(true);
            calendarService.getEvents(userId)
                .then((data) => {
                    const now = new Date();
                    const upcomingEvents = data.filter(event =>
                        new Date(event.end_at) > now
                    );
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
    }, [userId, isCalendarConnected, refreshTrigger]);

    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.start_at);

        switch (filter) {
            case 'today': {
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);
                return eventDate <= endOfToday;
            }
            case 'next_7_days': {
                const sevenDaysLater = new Date();
                sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
                return eventDate <= sevenDaysLater;
            }
            case 'week': {
                const endOfWeek = new Date();
                const dayOfWeek = endOfWeek.getDay();
                const daysUntilEndOfWeek = 6 - dayOfWeek;
                endOfWeek.setDate(endOfWeek.getDate() + daysUntilEndOfWeek);
                endOfWeek.setHours(23, 59, 59, 999);
                return eventDate <= endOfWeek;
            }
            case 'month': {
                const endOfMonth = new Date();
                endOfMonth.setMonth(endOfMonth.getMonth() + 1);
                endOfMonth.setDate(0);
                endOfMonth.setHours(23, 59, 59, 999);
                return eventDate <= endOfMonth;
            }
            case 'all':
            default:
                return true;
        }
    });

    const handleConnectGoogle = async () => {
        await connectGoogleCalendar();
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

    // Not connected state
    if (!isCalendarConnected && !isAuthLoading && !isLoading) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative overflow-y-auto custom-scrollbar flex ${compact ? 'flex-col items-start gap-4' : 'flex-row items-center justify-between'} p-6 rounded-3xl border border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] h-full shadow-2xl shadow-black/20`}
            >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className={`flex ${compact ? 'flex-col items-start' : 'flex-row items-center'} gap-4 z-10`}>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                      <CalendarIcon size={24} className="text-white/80" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold tracking-tight">{t('calendar.getStarted')}</h3>
                    <p className="text-white/40 text-sm mt-1">Sync your schedule instantly</p>
                  </div>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnectGoogle}
                    className={`relative z-10 flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all shadow-lg shadow-white/5 ${compact ? 'w-full justify-center' : ''}`}
                >
                    <div className="flex -space-x-1 mr-1">
                         <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19-8.5 19-19 0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-1.1 2.9-3.1 5.3-5.7 6.9l6.3 5.2C38.9 36.4 43 30.8 43 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
                    </div>
                    Connect
                    <span className="opacity-60">
                        <ArrowRightIcon size={16}/>
                    </span>
                </motion.button>
            </motion.div>
        );
    }

    // Loading state
    if (isAuthLoading || isLoading) {
        return (
            <div className="flex flex-col gap-3 p-6 bg-white/[0.02] rounded-3xl border border-white/5 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-24 bg-white/10 rounded-md"></div>
                    <div className="h-6 w-20 bg-white/10 rounded-lg"></div>
                </div>
                <div className="space-y-3">
                   {[1, 2, 3].map(i => (
                       <div key={i} className="h-16 w-full bg-white/5 rounded-xl border border-white/5" />
                   ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full flex flex-col overflow-hidden">
            {/* Session Expired Warning */}
            <AnimatePresence>
                {isSessionExpired && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-red-500/20 rounded-lg text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                </div>
                                <span className="text-xs text-red-400 font-medium">Session expired</span>
                            </div>
                            <button
                                onClick={handleConnectGoogle}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                Reconnect
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDeleteId && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-xs"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-white font-semibold text-lg mb-2">
                                    {t('calendar.deleteEvent')}
                                </h3>
                                <p className="text-white/50 text-sm leading-relaxed">
                                    {t('calendar.deleteEventWarning')}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleDeleteEvent(confirmDeleteId)}
                                    className="w-full py-3 px-4 bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
                                >
                                    {t('history.delete')}
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
                                >
                                    {t('history.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with Filter */}
            {events.length > 0 && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={16} className="text-blue-400" />
                        <h3 className="text-white font-semibold text-sm tracking-tight">{t('calendar.title')}</h3>
                    </div>
                    <div className="relative group">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as CalendarFilter)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-white/70 outline-none focus:ring-1 focus:ring-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <option value="today">{t('calendar.filter.today', 'Today')}</option>
                            <option value="next_7_days">{t('calendar.filter.next7Days', 'Next 7 Days')}</option>
                            <option value="week">{t('calendar.filter.week', 'This Week')}</option>
                            <option value="month">{t('calendar.filter.month', 'This Month')}</option>
                            <option value="all">{t('calendar.filter.all', 'All Events')}</option>
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover:text-white/70 transition-colors">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <AnimatePresence mode="popLayout">
                    {filteredEvents.length > 0 ? (
                        <div className="space-y-2 pb-2">
                            {filteredEvents.map((event, index) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05, duration: 0.2 }}
                                    className="group relative p-3.5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-default"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        {/* Status Indicator Line */}
                                        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
                                            event.status === 'confirmed' ? 'bg-green-500/50' : 'bg-red-500/50'
                                        } opacity-0 group-hover:opacity-100 transition-opacity`} />

                                        <div className="flex-1 min-w-0 ml-1">
                                            <h4 className="font-semibold text-white text-sm truncate pr-4">{event.title}</h4>
                                            
                                            <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                                                <span className="font-medium text-white/70">
                                                    {new Date(event.start_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                <span>
                                                    {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {event.description && (
                                                <p className="text-xs text-white/30 mt-1.5 line-clamp-1">{event.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                            {!event.id.startsWith('default-') && (
                                                <>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setEditingEvent(event)}
                                                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title={t('calendarPreview.edit', 'Edit')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                            <path d="m15 5 4 4" />
                                                        </svg>
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setConfirmDeleteId(event.id)}
                                                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title={t('calendar.deleteEvent')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        </svg>
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : events.length > 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.02] rounded-2xl border border-white/5 border-dashed"
                        >
                            <div className="p-3 bg-white/5 rounded-full mb-3">
                                <CalendarIcon size={20} className="text-white/30" />
                            </div>
                            <p className="text-sm text-white/60 font-medium">{t('calendar.noEventsInFilter', 'No events found')}</p>
                            <p className="text-xs text-white/30 mt-1 max-w-[150px]">{t('calendar.tryChangingFilter', 'Try adjusting your filter settings')}</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-8 text-center"
                        >
                            <p className="text-sm text-white/50 font-medium">{t('calendar.noEvents', 'No upcoming events')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
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
