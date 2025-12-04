use tauri::State;
use log::error;
use crate::domain::ai::chat::{
    usecase::{
        create_chat::CreateChatUseCase,
        send_message::SendMessageUseCase,
        sync_messages::SyncMessagesUseCase,
        backup_chat::BackupChatUseCase,
    },
    dto::{
        CreateChatDto, CreateChatResponse,
        SendMessageDto, SendMessageResponse, MessageDto,
        SyncMessagesDto, SyncMessagesResponse,
        BackupChatDto, BackupChatResponse,
    },
    service::chat_service::ChatServiceRequest, // Added this line
};
use crate::app_state::AppState;
use uuid::Uuid;

#[tauri::command]
pub async fn create_chat(dto: CreateChatDto, state: State<'_, AppState>) -> Result<CreateChatResponse, String> {
    let create_chat_usecase = CreateChatUseCase::new(
        state.sqlite_chat_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    create_chat_usecase.execute(user_id, dto.title)
        .await
        .map(|chat| CreateChatResponse { chat_id: chat.id.to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_message(dto: SendMessageDto, state: State<'_, AppState>) -> Result<SendMessageResponse, String> {
    let send_message_usecase = SendMessageUseCase::new(
        state.chat_service.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;
    let chat_id = Uuid::parse_str(&dto.chat_id)
        .map_err(|e| format!("Invalid chat_id format: {}", e))?;

    let request = ChatServiceRequest {
        user_id,
        chat_id,
        provider_name: dto.provider_name,
        prompt: dto.content,
        model: dto.model,
        temperature: dto.temperature,
        max_tokens: dto.max_tokens,
    };

    send_message_usecase.execute(request)
    .await
    .map(|message| SendMessageResponse {
        message: MessageDto {
            id: message.id.to_string(),
            chat_id: message.chat_id.to_string(),
            user_id: dto.user_id.clone(),
            role: message.role,
            content: message.content,
            created_at: message.created_at,
        },
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_messages(dto: SyncMessagesDto, state: State<'_, AppState>) -> Result<SyncMessagesResponse, String> {
    let sync_messages_usecase = SyncMessagesUseCase::new(
        state.sqlite_message_repo.clone(),
        state.postgres_message_repo.clone(),
        state.sqlite_chat_repo.clone(),
        state.postgres_chat_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;
    let chat_id = Uuid::parse_str(&dto.chat_id)
        .map_err(|e| format!("Invalid chat_id format: {}", e))?;

    sync_messages_usecase.execute(user_id, chat_id)
        .await
        .map(|_| SyncMessagesResponse { message: "Messages synced successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn backup_chat(dto: BackupChatDto, state: State<'_, AppState>) -> Result<BackupChatResponse, String> {
    let backup_chat_usecase = BackupChatUseCase::new(
        state.sqlite_chat_repo.clone(),
        state.postgres_chat_repo.clone(),
        state.sqlite_message_repo.clone(),
        state.postgres_message_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;
    let chat_id = Uuid::parse_str(&dto.chat_id)
        .map_err(|e| format!("Invalid chat_id format: {}", e))?;

    backup_chat_usecase.execute(user_id, chat_id)
        .await
        .map(|_| BackupChatResponse { message: "Chat backed up successfully to Supabase".to_string() })
        .map_err(|e| {
            error!("Backup failed for user {} chat {}: {}", dto.user_id, dto.chat_id, e);
            e.to_string()
        })
}