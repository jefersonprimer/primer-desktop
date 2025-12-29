use tauri::State;
use crate::domain::notification::email::{
    usecase::{
        send_email::SendEmailUseCase,
        send_chat_summary_email::SendChatSummaryEmailUseCase,
    },
    dto::{
        SendEmailDto, SendEmailResponse,
        SendChatSummaryEmailDto, SendChatSummaryEmailResponse,
    },
};
use crate::app_state::AppState;
use uuid::Uuid;

#[tauri::command]
pub async fn send_email(dto: SendEmailDto, state: State<'_, AppState>) -> Result<SendEmailResponse, String> {
    let send_email_usecase = SendEmailUseCase::new(
        state.email_service.clone(),
    );

    send_email_usecase.execute(dto.to, dto.subject, dto.html_body, dto.text_body)
        .await
        .map(|_| SendEmailResponse { message: "Email sent successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_chat_summary(dto: SendChatSummaryEmailDto, state: State<'_, AppState>) -> Result<SendChatSummaryEmailResponse, String> {
    // Use SQLite message repo since chats are stored locally
    let send_chat_summary_usecase = SendChatSummaryEmailUseCase::new(
        state.email_service.clone(),
        state.sqlite_chat_repo.clone(),
        state.sqlite_message_repo.clone(),
        state.user_repo.clone(),
        state.prompt_preset_repo.clone(),
        state.user_api_key_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;
    let chat_id = Uuid::parse_str(&dto.chat_id)
        .map_err(|e| format!("Invalid chat_id format: {}", e))?;

    send_chat_summary_usecase.execute(user_id, chat_id, dto.summary_preset_id)
        .await
        .map(|_| SendChatSummaryEmailResponse { message: "Chat summary sent successfully".to_string() })
        .map_err(|e| e.to_string())
}