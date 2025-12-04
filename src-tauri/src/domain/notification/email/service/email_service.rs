use std::sync::Arc;
use crate::domain::notification::email::{
    entity::email_message::EmailMessage,
    repository::email_sender::EmailSender,
};

pub struct EmailService {
    sender: Arc<dyn EmailSender>,
}

impl EmailService {
    pub fn new(sender: Arc<dyn EmailSender>) -> Self {
        Self { sender }
    }

    pub async fn send_basic_email(
        &self,
        to: &str,
        subject: &str,
        html: &str,
        text: &str,
    ) -> anyhow::Result<()> {
        
        let msg = EmailMessage {
            to: to.to_string(),
            subject: subject.to_string(),
            body_html: html.to_string(),
            body_text: text.to_string(),
        };

        self.sender.send(msg).await
    }
}

