use async_trait::async_trait;
use lettre::transport::smtp::client::{Tls, TlsParameters};
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
        eprintln!("[SmtpEmailSender] Initializing with host: {}, port: {}", host, port);

        let creds = lettre::transport::smtp::authentication::Credentials::new(
            user.to_string(),
            pass.to_string(),
        );

        let mut builder = SmtpTransport::relay(host)
            .unwrap()
            .port(port)
            .credentials(creds);

        // If port is 465, use implicit TLS (Wrapper)
        if port == 465 {
            eprintln!("[SmtpEmailSender] Configuring for Implicit TLS (port 465)");
            match TlsParameters::new(host.to_string()) {
                Ok(tls_params) => {
                    builder = builder.tls(Tls::Wrapper(tls_params));
                },
                Err(e) => {
                    eprintln!("[SmtpEmailSender] Failed to create TlsParameters: {:?}", e);
                }
            }
        }

        let mailer = builder.build();

        Self {
            mailer,
            from: from.to_string(),
        }
    }
}

#[async_trait]
impl EmailSender for SmtpEmailSender {
    async fn send(&self, msg: EmailMessage) -> anyhow::Result<()> {
        eprintln!("[SmtpEmailSender] Preparing to send email from {} to {}", self.from, msg.to);
        
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

        eprintln!("[SmtpEmailSender] Connecting to SMTP server...");

        task::spawn_blocking({
            let mailer = self.mailer.clone();
            move || {
                match mailer.send(&email) {
                    Ok(_) => {
                        eprintln!("[SmtpEmailSender] Email sent successfully!");
                        Ok(())
                    },
                    Err(e) => {
                        eprintln!("[SmtpEmailSender] Failed to send email: {:?}", e);
                        Err(e)
                    }
                }
            }
        })
        .await??;

        Ok(())
    }
}

