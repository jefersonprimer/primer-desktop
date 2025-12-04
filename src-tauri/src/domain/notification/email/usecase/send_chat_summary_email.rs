use std::sync::Arc;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use crate::domain::notification::email::service::email_service::EmailService;
use crate::domain::ai::chat::{
    repository::{
        chat_repository::ChatRepository,
        message_repository::MessageRepository,
    },
};
use crate::domain::user::repository::user_repository::UserRepository;

pub struct SendChatSummaryEmailUseCase {
    email_service: Arc<EmailService>,
    chat_repo: Arc<dyn ChatRepository>,
    message_repo: Arc<dyn MessageRepository>,
    user_repo: Arc<dyn UserRepository>,
}

impl SendChatSummaryEmailUseCase {
    pub fn new(
        email_service: Arc<EmailService>,
        chat_repo: Arc<dyn ChatRepository>,
        message_repo: Arc<dyn MessageRepository>,
        user_repo: Arc<dyn UserRepository>,
    ) -> Self {
        Self {
            email_service,
            chat_repo,
            message_repo,
            user_repo,
        }
    }

    pub async fn execute(&self, user_id: Uuid, chat_id: Uuid) -> Result<()> {
        // 1. Verify chat exists and belongs to user
        let chat = self.chat_repo.find_by_id(chat_id).await?
            .ok_or_else(|| anyhow!("Chat not found"))?;
        
        if chat.user_id != user_id {
            return Err(anyhow!("Chat does not belong to user"));
        }

        // 2. Get user email
        let user = self.user_repo.find_by_id(user_id).await?
            .ok_or_else(|| anyhow!("User not found"))?;

        // 3. Fetch all messages from the chat
        let messages = self.message_repo.find_by_chat_id(chat_id).await?;
        
        if messages.is_empty() {
            return Err(anyhow!("No messages found in chat"));
        }

        // 4. Format messages as HTML and text
        let (html_body, text_body) = Self::format_chat_summary(&chat, &messages);

        // 5. Send email
        let subject = format!(
            "Chat Summary: {}",
            chat.title.as_deref().unwrap_or("Untitled Chat")
        );

        self.email_service
            .send_basic_email(&user.email, &subject, &html_body, &text_body)
            .await?;

        Ok(())
    }

    fn format_chat_summary(chat: &crate::domain::ai::chat::entity::chat::Chat, messages: &[crate::domain::ai::chat::entity::message::Message]) -> (String, String) {
        let chat_title = chat.title.as_deref().unwrap_or("Untitled Chat");
        let created_at = chat.created_at.format("%Y-%m-%d %H:%M:%S UTC");

        // HTML format
        let mut html = format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4a90e2; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .message {{ margin-bottom: 15px; padding: 15px; border-radius: 5px; }}
        .user {{ background-color: #e3f2fd; border-left: 4px solid #2196f3; }}
        .assistant {{ background-color: #f1f8e9; border-left: 4px solid #8bc34a; }}
        .system {{ background-color: #fff3e0; border-left: 4px solid #ff9800; }}
        .role {{ font-weight: bold; margin-bottom: 5px; color: #555; }}
        .content {{ white-space: pre-wrap; }}
        .timestamp {{ font-size: 0.85em; color: #888; margin-top: 5px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{}</h1>
        <p>Created: {}</p>
        <p>Total Messages: {}</p>
    </div>
"#,
            chat_title,
            created_at,
            messages.len()
        );

        for message in messages {
            let role_class = match message.role.as_str() {
                "user" => "user",
                "assistant" => "assistant",
                _ => "system",
            };
            let timestamp = message.created_at.format("%Y-%m-%d %H:%M:%S UTC");
            
            html.push_str(&format!(
                r#"
    <div class="message {}">
        <div class="role">{}</div>
        <div class="content">{}</div>
        <div class="timestamp">{}</div>
    </div>
"#,
                role_class,
                message.role,
                html_escape(&message.content),
                timestamp
            ));
        }

        html.push_str("</body></html>");

        // Text format
        let mut text = format!(
            "Chat Summary: {}\nCreated: {}\nTotal Messages: {}\n\n{}\n",
            chat_title,
            created_at,
            messages.len(),
            "=".repeat(60)
        );

        for message in messages {
            let timestamp = message.created_at.format("%Y-%m-%d %H:%M:%S UTC");
            text.push_str(&format!(
                "\n[{}] - {}\n{}\n{}\n",
                message.role.to_uppercase(),
                timestamp,
                "-".repeat(40),
                message.content
            ));
        }

        (html, text)
    }
}

fn html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}
