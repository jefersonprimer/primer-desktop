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
use crate::domain::user::repository::user_api_key_repository::UserApiKeyRepository;
use crate::domain::prompt_preset::repository::PromptPresetRepository;

pub struct SendChatSummaryEmailUseCase {
    email_service: Arc<EmailService>,
    chat_repo: Arc<dyn ChatRepository>,
    message_repo: Arc<dyn MessageRepository>,
    user_repo: Arc<dyn UserRepository>,
    prompt_preset_repo: Arc<dyn PromptPresetRepository>,
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
}

impl SendChatSummaryEmailUseCase {
    pub fn new(
        email_service: Arc<EmailService>,
        chat_repo: Arc<dyn ChatRepository>,
        message_repo: Arc<dyn MessageRepository>,
        user_repo: Arc<dyn UserRepository>,
        prompt_preset_repo: Arc<dyn PromptPresetRepository>,
        user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    ) -> Self {
        Self {
            email_service,
            chat_repo,
            message_repo,
            user_repo,
            prompt_preset_repo,
            user_api_key_repo,
        }
    }

    pub async fn execute(&self, user_id: Uuid, chat_id: Uuid, summary_preset_id: Option<String>) -> Result<()> {
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

        // 4. Generate summary or use full chat log
        // We capture the bool before moving the option into generate_ai_summary
        let is_ai_summary = summary_preset_id.is_some();

        let (html_body, text_body) = if let Some(preset_id) = summary_preset_id {
            // AI-generated summary using the preset
            self.generate_ai_summary(&chat, &messages, &preset_id, user_id).await?
        } else {
            // Fallback to full chat log
            Self::format_chat_summary(&chat, &messages)
        };

        // 5. Send email
        let subject = if is_ai_summary {
            format!(
                "📌 Chat Summary: {}",
                chat.title.as_deref().unwrap_or("Untitled Chat")
            )
        } else {
            format!(
                "Chat Log: {}",
                chat.title.as_deref().unwrap_or("Untitled Chat")
            )
        };

        self.email_service
            .send_basic_email(&user.email, &subject, &html_body, &text_body)
            .await?;

        Ok(())
    }

    async fn generate_ai_summary(
        &self,
        chat: &crate::domain::ai::chat::entity::chat::Chat,
        messages: &[crate::domain::ai::chat::entity::message::Message],
        preset_id: &str,
        user_id: Uuid,
    ) -> Result<(String, String)> {
        // Get the summary prompt preset
        let preset = self.prompt_preset_repo.find_by_id(preset_id).await?
            .ok_or_else(|| anyhow!("Summary preset not found: {}", preset_id))?;

        // Format chat content for the AI
        let chat_content = messages.iter()
            .map(|m| format!("[{}]: {}", m.role.to_uppercase(), m.content))
            .collect::<Vec<_>>()
            .join("\n\n");

        let full_prompt = format!(
            "{}\n\n---\n\nChat to summarize:\n\n{}",
            preset.prompt,
            chat_content
        );

        // Find a provider to use (prefer Gemini, fallback to others)
        let api_keys = self.user_api_key_repo.find_by_user_id(user_id).await?;
        
        let (provider, model) = if let Some(key) = api_keys.iter().find(|k| k.provider == "gemini") {
            ("Gemini".to_string(), key.selected_model.clone().unwrap_or("gemini-1.5-flash-001".to_string()))
        } else if let Some(key) = api_keys.iter().find(|k| k.provider == "openai") {
            ("OpenAI".to_string(), key.selected_model.clone().unwrap_or("gpt-4o-mini".to_string()))
        } else if let Some(key) = api_keys.iter().find(|k| k.provider == "openrouter") {
            ("OpenRouter".to_string(), key.selected_model.clone().unwrap_or("google/gemini-flash-1.5".to_string()))
        } else {
            // No AI provider available, fallback to full chat log
            return Ok(Self::format_chat_summary(chat, messages));
        };

        // Create a temporary chat service request for summary generation
        // Note: We use Gemini's simple generate_content directly for simplicity
        let summary = match self.call_ai_for_summary(&provider, &model, &full_prompt, user_id).await {
            Ok(s) => s,
            Err(e) => {
                log::error!("Failed to generate AI summary: {}", e);
                // On error, create a simple summary from chat content
                format!(
                    "**Chat Summary**\n\n**Topic:** {}\n\n**Messages:** {} total",
                    chat.title.as_deref().unwrap_or("General Discussion"),
                    messages.len()
                )
            }
        };

        let chat_title = chat.title.as_deref().unwrap_or("Untitled Chat");
        let created_at = chat.created_at.format("%Y-%m-%d %H:%M:%S UTC");

        // HTML format
        let html = format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; }}
        .header h1 {{ margin: 0 0 10px 0; font-size: 1.5em; }}
        .header p {{ margin: 0; opacity: 0.9; font-size: 0.9em; }}
        .content {{ background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea; }}
        .content h2 {{ color: #667eea; margin-top: 0; }}
        .footer {{ margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef; font-size: 0.85em; color: #6c757d; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📌 {}</h1>
        <p>Created: {}</p>
    </div>
    <div class="content">
        {}
    </div>
    <div class="footer">
        <p>This is an AI-generated summary. For the full conversation, check your chat history.</p>
    </div>
</body>
</html>
"#,
            chat_title,
            created_at,
            Self::markdown_to_html(&summary)
        );

        // Text format
        let text = format!(
            "📌 Chat Summary: {}\nCreated: {}\n\n{}\n\n---\nThis is an AI-generated summary.",
            chat_title,
            created_at,
            summary
        );

        Ok((html, text))
    }

    async fn call_ai_for_summary(
        &self,
        provider: &str,
        model: &str,
        prompt: &str,
        user_id: Uuid,
    ) -> Result<String> {
        let api_keys = self.user_api_key_repo.find_by_user_id(user_id).await?;
        
        let provider_key = match provider {
            "Gemini" => "gemini",
            "OpenAI" => "openai",
            "OpenRouter" => "openrouter",
            _ => return Err(anyhow!("Unsupported provider")),
        };
        
        let api_key = api_keys.iter()
            .find(|k| k.provider == provider_key)
            .map(|k| k.api_key.clone())
            .ok_or_else(|| anyhow!("No API key for provider"))?;

        // Use reqwest to call the AI directly for simple summary generation
        let client = reqwest::Client::new();
        
        let response_text = match provider {
            "Gemini" => {
                let url = format!(
                    "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                    model, api_key
                );
                let body = serde_json::json!({
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 1024
                    }
                });
                
                let resp = client.post(&url)
                    .json(&body)
                    .send()
                    .await?;

                if !resp.status().is_success() {
                    let status = resp.status();
                    let error_body = resp.text().await.unwrap_or_default();
                    return Err(anyhow!("Gemini API error {}: {}", status, error_body));
                }
                
                let json: serde_json::Value = resp.json().await?;
                json["candidates"][0]["content"]["parts"][0]["text"]
                    .as_str()
                    .ok_or_else(|| anyhow!("Invalid Gemini response structure: {:?}", json))?
                    .to_string()
            },
            "OpenAI" => {
                let body = serde_json::json!({
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1024
                });
                
                let resp = client.post("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", format!("Bearer {}", api_key))
                    .json(&body)
                    .send()
                    .await?;

                if !resp.status().is_success() {
                    let status = resp.status();
                    let error_body = resp.text().await.unwrap_or_default();
                    return Err(anyhow!("OpenAI API error {}: {}", status, error_body));
                }
                
                let json: serde_json::Value = resp.json().await?;
                json["choices"][0]["message"]["content"]
                    .as_str()
                    .ok_or_else(|| anyhow!("Invalid OpenAI response structure: {:?}", json))?
                    .to_string()
            },
            "OpenRouter" => {
                let body = serde_json::json!({
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1024
                });
                
                let resp = client.post("https://openrouter.ai/api/v1/chat/completions")
                    .header("Authorization", format!("Bearer {}", api_key))
                    .json(&body)
                    .send()
                    .await?;

                if !resp.status().is_success() {
                    let status = resp.status();
                    let error_body = resp.text().await.unwrap_or_default();
                    return Err(anyhow!("OpenRouter API error {}: {}", status, error_body));
                }
                
                let json: serde_json::Value = resp.json().await?;
                json["choices"][0]["message"]["content"]
                    .as_str()
                    .ok_or_else(|| anyhow!("Invalid OpenRouter response structure: {:?}", json))?
                    .to_string()
            },
            _ => return Err(anyhow!("Unsupported provider")),
        };

        Ok(response_text)
    }

    fn markdown_to_html(md: &str) -> String {
        // Simple markdown to HTML conversion
        md.lines()
            .map(|line| {
                let trimmed = line.trim();
                if trimmed.starts_with("## ") {
                    format!("<h2>{}</h2>", &trimmed[3..])
                } else if trimmed.starts_with("# ") {
                    format!("<h1>{}</h1>", &trimmed[2..])
                } else if trimmed.starts_with("- ") || trimmed.starts_with("* ") {
                    format!("<li>{}</li>", &trimmed[2..])
                } else if trimmed.is_empty() {
                    "<br>".to_string()
                } else {
                    format!("<p>{}</p>", trimmed)
                }
            })
            .collect::<Vec<_>>()
            .join("\n")
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

