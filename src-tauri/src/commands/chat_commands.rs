use tauri::State;
use crate::domain::ai::chat::{
    usecase::{
        create_chat::CreateChatUseCase,
        send_message::SendMessageUseCase,
        get_chats::GetChatsUseCase,
        get_messages::GetMessagesUseCase,
        delete_chat::DeleteChatUseCase,
        delete_all_chats::DeleteAllChatsUseCase,
    },
    dto::{
        CreateChatDto, CreateChatResponse,
        SendMessageDto, SendMessageResponse, MessageDto,
        GetChatsDto, GetChatsResponse, ChatDto,
        GetMessagesDto, GetMessagesResponse,
        DeleteChatDto, DeleteChatResponse,
        DeleteAllChatsDto, DeleteAllChatsResponse,
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

    // Attempt to create chat. If it fails due to FK constraint (likely invalid prompt_preset_id), retry with None.
    match create_chat_usecase.execute(user_id, dto.title.clone(), dto.prompt_preset_id.clone(), dto.model.clone()).await {
        Ok(chat) => Ok(CreateChatResponse { chat_id: chat.id.to_string() }),
        Err(e) => {
             let err_msg = e.to_string();
             if err_msg.contains("FOREIGN KEY constraint failed") {
                 log::warn!("Create chat failed with preset {:?}, retrying with None. Error: {}", dto.prompt_preset_id, err_msg);
                 create_chat_usecase.execute(user_id, dto.title, None, dto.model)
                    .await
                    .map(|chat| CreateChatResponse { chat_id: chat.id.to_string() })
                    .map_err(|e| e.to_string())
             } else {
                 Err(err_msg)
             }
        }
    }
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
        image: dto.image,
        output_language: dto.output_language,
    };

    send_message_usecase.execute(request)
    .await
    .map(|(message, follow_ups)| SendMessageResponse {
        message: MessageDto {
            id: message.id.to_string(),
            chat_id: message.chat_id.to_string(),
            user_id: Some(dto.user_id.clone()),
            role: message.role,
            content: message.content,
            created_at: message.created_at,
        },
        follow_ups,
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_chats(dto: GetChatsDto, state: State<'_, AppState>) -> Result<GetChatsResponse, String> {
    let get_chats_usecase = GetChatsUseCase::new(
        state.sqlite_chat_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    get_chats_usecase.execute(user_id)
        .await
        .map(|chats| GetChatsResponse {
            chats: chats.into_iter().map(|c| ChatDto {
                id: c.id.to_string(),
                user_id: c.user_id.to_string(),
                title: c.title.unwrap_or_else(|| "New Chat".to_string()),
                model: c.model,
                created_at: c.created_at,
                updated_at: c.updated_at,
            }).collect()
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_messages(dto: GetMessagesDto, state: State<'_, AppState>) -> Result<GetMessagesResponse, String> {
    let get_messages_usecase = GetMessagesUseCase::new(
        state.sqlite_message_repo.clone(),
    );

    let chat_id = Uuid::parse_str(&dto.chat_id)
        .map_err(|e| format!("Invalid chat_id format: {}", e))?;

    get_messages_usecase.execute(chat_id)
        .await
        .map(|messages| GetMessagesResponse {
            messages: messages.into_iter().map(|m| MessageDto {
                id: m.id.to_string(),
                chat_id: m.chat_id.to_string(),
                user_id: None,
                role: m.role,
                content: m.content,
                created_at: m.created_at,
            }).collect()
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_chat(dto: DeleteChatDto, state: State<'_, AppState>) -> Result<DeleteChatResponse, String> {
    let delete_chat_usecase = DeleteChatUseCase::new(
        state.sqlite_chat_repo.clone(),
    );

    let chat_id = Uuid::parse_str(&dto.chat_id)
        .map_err(|e| format!("Invalid chat_id format: {}", e))?;

    delete_chat_usecase.execute(chat_id)
        .await
        .map(|_| DeleteChatResponse { message: "Chat deleted successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_all_chats(dto: DeleteAllChatsDto, state: State<'_, AppState>) -> Result<DeleteAllChatsResponse, String> {
    let delete_all_chats_usecase = DeleteAllChatsUseCase::new(
        state.sqlite_chat_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    delete_all_chats_usecase.execute(user_id)
        .await
        .map(|_| DeleteAllChatsResponse { message: "All chats deleted successfully".to_string() })
        .map_err(|e| e.to_string())
}