use anyhow::Result;
use async_trait::async_trait;
use crate::domain::user::entity::session::Session;

#[async_trait]
pub trait SessionRepository: Send + Sync {
    async fn save(&self, session: Session) -> Result<Session>;
    async fn get(&self) -> Result<Option<Session>>;
    async fn clear(&self) -> Result<()>;
}
