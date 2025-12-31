use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::domain::{
    calendar::{
        entity::GoogleCalendarEvent,
        repository::CalendarRepository,
        service::{GoogleCalendarService, CreateEventPayload, EventDateTime},
    },
    user::repository::session_repository::SessionRepository,
};

pub struct CreateEventUseCase {
    calendar_repo: Arc<dyn CalendarRepository>,
    session_repo: Arc<dyn SessionRepository>,
}

impl CreateEventUseCase {
    pub fn new(
        calendar_repo: Arc<dyn CalendarRepository>,
        session_repo: Arc<dyn SessionRepository>,
    ) -> Self {
        Self { calendar_repo, session_repo }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        title: String,
        description: Option<String>,
        start_at: DateTime<Utc>,
        end_at: DateTime<Utc>,
        source_chat_id: Option<Uuid>,
    ) -> Result<GoogleCalendarEvent> {
        // 1. Get Session for Token
        let session = self.session_repo.get().await?
            .ok_or_else(|| anyhow!("No active session found"))?;
        
        let initial_access_token = session.google_access_token
            .ok_or_else(|| anyhow!("User has not authorized Google Calendar access"))?;

        // 2. Prepare Payload
        let payload = CreateEventPayload {
            summary: title.clone(),
            description: description.clone(),
            start: EventDateTime {
                date_time: start_at.to_rfc3339(),
                time_zone: None, 
            },
            end: EventDateTime {
                date_time: end_at.to_rfc3339(),
                time_zone: None, 
            },
        };

        // 3. Call Google API
        // Note: Simple implementation without refresh token logic for now. 
        // If token expires, user must re-login or we implement refresh using refresh_token if available (not in current scope)
        let google_event = GoogleCalendarService::create_event(&initial_access_token, payload).await?;

        // 4. Create Entity
        let event = GoogleCalendarEvent {
            id: Uuid::new_v4(),
            user_id,
            google_event_id: google_event.id,
            calendar_id: "primary".to_string(),
            title,
            description,
            start_at,
            end_at,
            timezone: "UTC".to_string(), // Simplified
            created_by: "agent".to_string(),
            source_chat_id,
            status: google_event.status,
            created_at: Some(Utc::now()),
            updated_at: Some(Utc::now()),
        };

        // 5. Save to DB
        let saved_event = self.calendar_repo.save(event).await?;
        Ok(saved_event)
    }
}
