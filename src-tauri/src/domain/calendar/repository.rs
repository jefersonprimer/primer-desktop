use anyhow::Result;
use async_trait::async_trait;
use uuid::Uuid;
use crate::domain::calendar::entity::GoogleCalendarEvent;

#[async_trait]
pub trait CalendarRepository: Send + Sync {
    async fn save(&self, event: GoogleCalendarEvent) -> Result<GoogleCalendarEvent>;
    async fn update(&self, event: GoogleCalendarEvent) -> Result<GoogleCalendarEvent>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<GoogleCalendarEvent>>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<GoogleCalendarEvent>>;
    async fn get_by_id(&self, id: Uuid) -> Result<Option<GoogleCalendarEvent>> {
        self.find_by_id(id).await
    }
    async fn delete(&self, id: Uuid) -> Result<()>;
}
