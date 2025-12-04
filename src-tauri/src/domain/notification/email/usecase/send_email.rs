use std::sync::Arc;
use crate::domain::notification::email::service::email_service::EmailService;

pub struct SendEmailUseCase {
    service: Arc<EmailService>,
}

impl SendEmailUseCase {
    pub fn new(service: Arc<EmailService>) -> Self {
        Self { service }
    }

    pub async fn execute(
        &self,
        to: String,
        subject: String,
        html_body: String,
        text_body: String,
    ) -> anyhow::Result<()> {
        self.service.send_basic_email(&to, &subject, &html_body, &text_body).await
    }
}

