use async_trait::async_trait;
use lettre::{Message, SmtpTransport, Transport};
use tokio::task; // For tokio::task::spawn_blocking
use crate::domain::notification::email::{
    entity::email_message::EmailMessage,
    repository::email_sender::EmailSender,
};

pub struct SmtpEmailSender {
    mailer: SmtpTransport,
    from: String,
}

impl SmtpEmailSender {
    pub fn new(host: &str, port: u16, user: &str, pass: &str, from: &str) -> Self {
        let creds = lettre::transport::smtp::authentication::Credentials::new(
            user.to_string(),
            pass.to_string(),
        );

        let mailer = SmtpTransport::relay(host)
            .unwrap()
            .port(port)
            .credentials(creds)
            .build();

        Self {
            mailer,
            from: from.to_string(),
        }
    }
}

#[async_trait]
impl EmailSender for SmtpEmailSender {
    async fn send(&self, msg: EmailMessage) -> anyhow::Result<()> {
        let email = Message::builder()
            .from(self.from.parse()?)
            .to(msg.to.parse()?)
            .subject(msg.subject)
            .multipart(
                lettre::message::MultiPart::alternative() 
                    .singlepart(
                        lettre::message::SinglePart::plain(msg.body_text)
                    )
                    .singlepart(
                        lettre::message::SinglePart::html(msg.body_html)
                    )
            )?;

        task::spawn_blocking({
            let mailer = self.mailer.clone();
            move || mailer.send(&email)
        })
        .await??;

        Ok(())
    }
}

