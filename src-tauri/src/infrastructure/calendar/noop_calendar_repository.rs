use async_trait::async_trait;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use crate::domain::calendar::{
    entity::GoogleCalendarEvent,
    repository::CalendarRepository,
};

pub struct NoOpCalendarRepository;

impl NoOpCalendarRepository {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl CalendarRepository for NoOpCalendarRepository {
    async fn save(&self, _event: GoogleCalendarEvent) -> Result<GoogleCalendarEvent> {
        Err(anyhow!("Calendar functionality not available in this mode"))
    }

    async fn find_by_user_id(&self, _user_id: Uuid) -> Result<Vec<GoogleCalendarEvent>> {
        Ok(vec![])
    }

    async fn find_by_id(&self, _id: Uuid) -> Result<Option<GoogleCalendarEvent>> {
        Ok(None)
    }

    async fn delete(&self, _id: Uuid) -> Result<()> {
        Ok(())
    }
}
