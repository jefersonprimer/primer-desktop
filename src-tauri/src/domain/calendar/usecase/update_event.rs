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

pub struct UpdateEventUseCase {
    calendar_repo: Arc<dyn CalendarRepository>,
    session_repo: Arc<dyn SessionRepository>,
}

impl UpdateEventUseCase {
    pub fn new(
        calendar_repo: Arc<dyn CalendarRepository>,
        session_repo: Arc<dyn SessionRepository>,
    ) -> Self {
        Self { calendar_repo, session_repo }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        event_id: Uuid,
        title: String,
        description: Option<String>,
        start_at: DateTime<Utc>,
        end_at: DateTime<Utc>,
    ) -> Result<GoogleCalendarEvent> {
        // 1. Get the existing event
        let existing_event = self.calendar_repo.get_by_id(event_id).await?
            .ok_or_else(|| anyhow!("Event not found"))?;
        
        // Verify ownership
        if existing_event.user_id != user_id {
            return Err(anyhow!("Unauthorized: event does not belong to user"));
        }

        // 2. Get Session for Token
        let mut session = self.session_repo.get().await?
            .ok_or_else(|| anyhow!("No active session found"))?;
        
        let mut access_token = session.google_access_token.clone()
            .ok_or_else(|| anyhow!("User has not authorized Google Calendar access"))?;

        // 3. Check if token is expired and refresh if needed
        let now = Utc::now().timestamp();
        let is_expired = session.google_token_expires_at
            .map(|exp| exp <= now + 60)
            .unwrap_or(false);

        if is_expired {
            log::info!("Google access token expired, attempting refresh...");
            
            let refresh_token = session.google_refresh_token.clone()
                .ok_or_else(|| anyhow!("Token expired and no refresh token available. Please re-connect Google Calendar."))?;
            
            let client_id = std::env::var("GOOGLE_CLIENT_ID")
                .map_err(|_| anyhow!("GOOGLE_CLIENT_ID not set"))?;
            let client_secret = std::env::var("GOOGLE_CLIENT_SECRET")
                .map_err(|_| anyhow!("GOOGLE_CLIENT_SECRET not set"))?;
            
            let token_response = GoogleCalendarService::refresh_access_token(
                &refresh_token, 
                &client_id, 
                &client_secret
            ).await?;
            
            access_token = token_response.access_token.clone();
            session.google_access_token = Some(token_response.access_token);
            session.google_token_expires_at = Some(now + token_response.expires_in);
            
            self.session_repo.save(session).await?;
            log::info!("Google access token refreshed successfully");
        }

        // 4. Prepare Payload for Google API
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

        // 5. Call Google API to update
        GoogleCalendarService::update_event(
            &access_token, 
            &existing_event.calendar_id, 
            &existing_event.google_event_id, 
            payload
        ).await?;

        // 6. Update local entity
        let updated_event = GoogleCalendarEvent {
            id: existing_event.id,
            user_id,
            google_event_id: existing_event.google_event_id,
            calendar_id: existing_event.calendar_id,
            title,
            description,
            start_at,
            end_at,
            timezone: existing_event.timezone,
            created_by: existing_event.created_by,
            source_chat_id: existing_event.source_chat_id,
            status: existing_event.status,
            created_at: existing_event.created_at,
            updated_at: Some(Utc::now()),
        };

        // 7. Save to DB
        let saved_event = self.calendar_repo.update(updated_event).await?;
        Ok(saved_event)
    }
}
