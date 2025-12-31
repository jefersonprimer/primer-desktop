use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
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
        let session = self.session_repo.get().await?
            .ok_or_else(|| anyhow!("No active session found"))?;
        
        let initial_access_token = session.google_access_token
            .ok_or_else(|| anyhow!("User has not authorized Google Calendar access"))?;

        // 2. Get Event from DB to verify ownership and get google_id
        let event = self.calendar_repo.find_by_id(event_id).await?
            .ok_or_else(|| anyhow!("Event not found"))?;

        if event.user_id != user_id {
            return Err(anyhow!("Unauthorized: Event does not belong to user"));
        }

        // 3. Call Google API
        GoogleCalendarService::delete_event(
            &initial_access_token, 
            &event.calendar_id, 
            &event.google_event_id
        ).await?;

        // 4. Delete from DB
        self.calendar_repo.delete(event_id).await?;

        Ok(())
    }
}
