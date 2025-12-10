use tauri::State;
use crate::domain::user::{
    usecase::{
        login::LoginUseCase,
        register::RegisterUseCase,
        reset_password::ResetPasswordUseCase,
        add_api_key::AddApiKeyUseCase,
        get_api_keys::GetApiKeysUseCase,
        delete_api_key::DeleteApiKeyUseCase,
        delete_account::DeleteAccountUseCase,
        save_shortcut::SaveShortcutUseCase,
        get_shortcuts::GetShortcutsUseCase,
        backup_shortcuts::BackupShortcutsUseCase,
    },
    dto::{
        LoginDto, LoginResponse,
        RegisterDto, RegisterResponse,
        ResetPasswordDto, ResetPasswordResponse,
        AddApiKeyDto, AddApiKeyResponse,
        GetApiKeysDto, GetApiKeysResponse, ApiKeyDto,
        DeleteApiKeyDto, DeleteApiKeyResponse,
        DeleteAccountDto, DeleteAccountResponse,
        SessionResponse, ClearSessionResponse,
        SaveShortcutDto, SaveShortcutResponse,
        GetShortcutsDto, GetShortcutsResponse,
        BackupShortcutsDto, BackupShortcutsResponse,
    },
};
use crate::app_state::AppState;
use uuid::Uuid;

#[tauri::command]
pub async fn login(dto: LoginDto, state: State<'_, AppState>) -> Result<LoginResponse, String> {
    let login_usecase = LoginUseCase::new(
        state.user_repo.clone(),
        state.password_hasher.clone(),
        state.token_generator.clone(),
        state.session_repo.clone(),
    );

    login_usecase.execute(dto.email, dto.password)
        .await
        .map(|(token, user_id)| LoginResponse { token, user_id })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn register(dto: RegisterDto, state: State<'_, AppState>) -> Result<RegisterResponse, String> {
    let register_usecase = RegisterUseCase::new(
        state.user_repo.clone(),
        state.password_hasher.clone(),
    );

    register_usecase.execute(dto.email, dto.password)
        .await
        .map(|_| RegisterResponse { message: "User registered successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reset_password(dto: ResetPasswordDto, state: State<'_, AppState>) -> Result<ResetPasswordResponse, String> {
    let reset_password_usecase = ResetPasswordUseCase::new(
        state.user_repo.clone(),
        state.token_generator.clone(),
        state.password_hasher.clone(),
    );

    reset_password_usecase.execute(dto.token, dto.new_password)
        .await
        .map(|_| ResetPasswordResponse { message: "Password reset successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_api_key(dto: AddApiKeyDto, state: State<'_, AppState>) -> Result<AddApiKeyResponse, String> {
    let add_api_key_usecase = AddApiKeyUseCase::new(
        state.user_api_key_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    add_api_key_usecase.execute(user_id, dto.provider, dto.api_key, dto.selected_model)
        .await
        .map(|_| AddApiKeyResponse { message: "API key added successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_api_keys(dto: GetApiKeysDto, state: State<'_, AppState>) -> Result<GetApiKeysResponse, String> {
    let get_api_keys_usecase = GetApiKeysUseCase::new(
        state.user_api_key_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    get_api_keys_usecase.execute(user_id)
        .await
        .map(|api_keys| {
            let api_key_dtos = api_keys.into_iter().map(|key| ApiKeyDto {
                id: key.id.to_string(),
                user_id: key.user_id.to_string(),
                provider: key.provider,
                api_key: key.api_key,
                selected_model: key.selected_model,
                created_at: key.created_at.to_rfc3339(),
            }).collect();
            GetApiKeysResponse { api_keys: api_key_dtos }
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_api_key(dto: DeleteApiKeyDto, state: State<'_, AppState>) -> Result<DeleteApiKeyResponse, String> {
    let delete_api_key_usecase = DeleteApiKeyUseCase::new(
        state.user_api_key_repo.clone(),
    );

    let api_key_id = Uuid::parse_str(&dto.api_key_id)
        .map_err(|e| format!("Invalid api_key_id format: {}", e))?;

    delete_api_key_usecase.execute(api_key_id)
        .await
        .map(|_| DeleteApiKeyResponse { message: "API key deleted successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_account(dto: DeleteAccountDto, state: State<'_, AppState>) -> Result<DeleteAccountResponse, String> {
    let delete_account_usecase = DeleteAccountUseCase::new(
        state.user_repo.clone(),
        state.password_hasher.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    delete_account_usecase.execute(user_id, dto.password)
        .await
        .map(|_| DeleteAccountResponse { message: "Account deleted successfully".to_string() })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_session(state: State<'_, AppState>) -> Result<Option<SessionResponse>, String> {
    let session = state.session_repo.get()
        .await
        .map_err(|e| e.to_string())?;

    match session {
        Some(s) => {
            // Check if session is expired
            let now = chrono::Utc::now().timestamp();
            if s.expires_at <= now {
                // Session expired, clear it
                let _ = state.session_repo.clear().await;
                return Ok(None);
            }

            Ok(Some(SessionResponse {
                user_id: s.user_id.to_string(),
                access_token: s.access_token,
                expires_at: s.expires_at,
            }))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn clear_session(state: State<'_, AppState>) -> Result<ClearSessionResponse, String> {
    state.session_repo.clear()
        .await
        .map_err(|e| e.to_string())?;

    Ok(ClearSessionResponse {
        message: "Session cleared successfully".to_string(),
    })
}

#[tauri::command]
pub async fn save_shortcut(dto: SaveShortcutDto, state: State<'_, AppState>) -> Result<SaveShortcutResponse, String> {
    let save_shortcut_usecase = SaveShortcutUseCase::new(state.shortcut_repo.clone());

    save_shortcut_usecase.execute(dto)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]

pub async fn get_shortcuts(dto: GetShortcutsDto, state: State<'_, AppState>) -> Result<GetShortcutsResponse, String> {

    let get_shortcuts_usecase = GetShortcutsUseCase::new(state.shortcut_repo.clone());



    get_shortcuts_usecase.execute(dto)

        .await

        .map_err(|e| e.to_string())

}



#[tauri::command]

pub async fn backup_shortcuts(dto: BackupShortcutsDto, state: State<'_, AppState>) -> Result<BackupShortcutsResponse, String> {

    // Only proceed if we have a connection to Postgres

    let postgres_repo = state.postgres_shortcut_repo.clone()

        .ok_or_else(|| "No connection to cloud database".to_string())?;



    let backup_shortcuts_usecase = BackupShortcutsUseCase::new(

        state.sqlite_shortcut_repo.clone(),

        postgres_repo,

    );



    backup_shortcuts_usecase.execute(dto)

        .await

        .map_err(|e| e.to_string())

}
