use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use chrono::Utc;
use crate::domain::{
    calendar::{
        repository::CalendarRepository,
        service::GoogleCalendarService,
    },
    user::repository::session_repository::SessionRepository,
};

pub struct DeleteEventUseCase {
    calendar_repo: Arc<dyn CalendarRepository>,
    session_repo: Arc<dyn SessionRepository>,
}

impl DeleteEventUseCase {
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
    ) -> Result<()> {
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

        // 3. Get Event from DB to verify ownership and get google_id
        let event = self.calendar_repo.find_by_id(event_id).await?
            .ok_or_else(|| anyhow!("Event not found"))?;

        if event.user_id != user_id {
            return Err(anyhow!("Unauthorized: Event does not belong to user"));
        }

        // 4. Call Google API
        GoogleCalendarService::delete_event(
            &access_token, 
            &event.calendar_id, 
            &event.google_event_id
        ).await?;

        // 5. Delete from DB
        self.calendar_repo.delete(event_id).await?;

        Ok(())
    }
}
