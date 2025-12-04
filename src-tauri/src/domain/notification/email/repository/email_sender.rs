use crate::domain::notification::email::entity::email_message::EmailMessage;
use async_trait::async_trait;

#[async_trait]
pub trait EmailSender: Send + Sync {
    async fn send(&self, msg: EmailMessage) -> anyhow::Result<()>;
}

