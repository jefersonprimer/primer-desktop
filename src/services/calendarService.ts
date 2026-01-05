import { invoke } from "@tauri-apps/api/core";

export interface CalendarEvent {
  id: string;
  google_event_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  status: string;
}

export const calendarService = {
  createEvent: async (dto: {
    user_id: string;
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
    source_chat_id?: string;
  }) => {
    return await invoke("create_calendar_event", { dto });
  },

  getEvents: async (userId: string): Promise<CalendarEvent[]> => {
    const response = await invoke<{ events: CalendarEvent[] }>("get_calendar_events", {
      dto: { user_id: userId },
    });
    return response.events;
  },

  deleteEvent: async (userId: string, eventId: string) => {
    return await invoke("delete_calendar_event", {
      dto: { user_id: userId, event_id: eventId },
    });
  },

  updateEvent: async (dto: {
    user_id: string;
    event_id: string;
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
  }): Promise<CalendarEvent> => {
    return await invoke<CalendarEvent>("update_calendar_event", { dto });
  },
};
