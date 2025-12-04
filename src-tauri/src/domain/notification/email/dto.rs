use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct SendEmailDto {
    pub to: String,
    pub subject: String,
    pub html_body: String,
    pub text_body: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendEmailResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendChatSummaryEmailDto {
    pub user_id: String,
    pub chat_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendChatSummaryEmailResponse {
    pub message: String,
}
