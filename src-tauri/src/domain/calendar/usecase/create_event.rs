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
        let mut session = self.session_repo.get().await?
            .ok_or_else(|| anyhow!("No active session found"))?;
        
        let mut access_token = session.google_access_token.clone()
            .ok_or_else(|| anyhow!("User has not authorized Google Calendar access"))?;

        // 2. Check if token is expired and refresh if needed
        let now = Utc::now().timestamp();
        let is_expired = session.google_token_expires_at
            .map(|exp| exp <= now + 60) // Refresh if expires within 60 seconds
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
            
            // Update session with new token
            access_token = token_response.access_token.clone();
            session.google_access_token = Some(token_response.access_token);
            session.google_token_expires_at = Some(now + token_response.expires_in);
            
            // Save updated session
            self.session_repo.save(session).await?;
            log::info!("Google access token refreshed successfully");
        }

        // 3. Prepare Payload
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

        // 4. Call Google API
        let google_event = GoogleCalendarService::create_event(&access_token, payload).await?;

        // 5. Create Entity
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

        // 6. Save to DB
        let saved_event = self.calendar_repo.save(event).await?;
        Ok(saved_event)
    }
}
