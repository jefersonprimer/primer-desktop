use anyhow::{Result};
use uuid::Uuid;
use std::sync::Arc;
use crate::domain::calendar::repository::CalendarRepository;
use crate::domain::user::repository::session_repository::SessionRepository;
use crate::domain::calendar::service::{GoogleCalendarService, GoogleEvent};
use crate::domain::calendar::entity::GoogleCalendarEvent;

pub struct ListEventsUseCase {
    calendar_repo: Arc<dyn CalendarRepository>,
    session_repo: Arc<dyn SessionRepository>,
}

impl ListEventsUseCase {
    pub fn new(
        calendar_repo: Arc<dyn CalendarRepository>,
        session_repo: Arc<dyn SessionRepository>,
    ) -> Self {
        Self {
            calendar_repo,
            session_repo,
        }
    }

    pub async fn execute(&self, user_id: Uuid) -> Result<Vec<GoogleCalendarEvent>> {
        // 1. Get local events
        let mut local_events = self.calendar_repo.find_by_user_id(user_id).await?;

        // 2. Try to get Google events if session is active
        if let Ok(Some(session)) = self.session_repo.get().await {
            if let Some(token) = session.google_access_token {
                // Fetch list of calendars (Primary + Holidays + etc)
                if let Ok(calendars) = GoogleCalendarService::list_calendars(&token).await {
                    for calendar in calendars {
                         // Fetch events for each calendar
                         // We could parallelize this, but let's keep it simple for now to avoid complexity with errors
                        if let Ok(google_events) = GoogleCalendarService::list_events(&token, &calendar.id).await {
                            // Merge google events that are NOT in our local DB
                            for ge in google_events {
                                // Check if we already have this event locally (by google_event_id)
                                if !local_events.iter().any(|le| le.google_event_id == ge.id) {
                                    if let Some(mapped) = self.map_google_event_to_entity(ge, user_id, &calendar.id) {
                                        local_events.push(mapped);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(local_events)
    }

    fn map_google_event_to_entity(&self, ge: GoogleEvent, user_id: Uuid, calendar_id: &str) -> Option<GoogleCalendarEvent> {
        let start_str = ge.start.as_ref()?.date_time.as_ref().or(ge.start.as_ref()?.date.as_ref())?;
        let end_str = ge.end.as_ref()?.date_time.as_ref().or(ge.end.as_ref()?.date.as_ref())?;

        let start_at = chrono::DateTime::parse_from_rfc3339(start_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .or_else(|_| {
                chrono::NaiveDate::parse_from_str(start_str, "%Y-%m-%d")
                    .map(|d| d.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(chrono::Utc).unwrap())
            }).ok()?;

        let end_at = chrono::DateTime::parse_from_rfc3339(end_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .or_else(|_| {
                chrono::NaiveDate::parse_from_str(end_str, "%Y-%m-%d")
                    .map(|d| d.and_hms_opt(23, 59, 59).unwrap().and_local_timezone(chrono::Utc).unwrap())
            }).ok()?;

        Some(GoogleCalendarEvent {
            id: Uuid::new_v4(), // Virtual ID for non-local events
            user_id,
            google_event_id: ge.id,
            calendar_id: calendar_id.to_string(),
            title: ge.summary.unwrap_or_else(|| "No Title".to_string()),
            description: ge.description,
            start_at,
            end_at,
            timezone: "UTC".to_string(), // Default timezone, ideally parse from event
            created_by: "google".to_string(),
            source_chat_id: None,
            status: ge.status,
            created_at: Some(chrono::Utc::now()),
            updated_at: Some(chrono::Utc::now()),
        })
    }
}
