use async_trait::async_trait;

use crate::domain::notification::email::{
    entity::email_message::EmailMessage,
    repository::email_sender::EmailSender,
};

pub struct NoopEmailSender;

impl NoopEmailSender {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl EmailSender for NoopEmailSender {
    async fn send(&self, msg: EmailMessage) -> anyhow::Result<()> {
        eprintln!(
            "[NoopEmailSender] SMTP disabled; dropping email to {} (subject: {}).",
            msg.to, msg.subject
        );
        Ok(())
    }
}

