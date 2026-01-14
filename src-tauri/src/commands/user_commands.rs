use tauri::State;
use crate::domain::user::{
    usecase::{
        add_api_key::AddApiKeyUseCase,
        get_api_keys::GetApiKeysUseCase,
        delete_api_key::DeleteApiKeyUseCase,
    },
    dto::{
        AddApiKeyDto, AddApiKeyResponse,
        GetApiKeysDto, GetApiKeysResponse, ApiKeyDto,
        DeleteApiKeyDto, DeleteApiKeyResponse,
        DeleteAccountDto, DeleteAccountResponse,
        ClearAllDataDto, ClearAllDataResponse,
    },
};
use crate::domain::maintenance::entity::UserStats;
use crate::app_state::AppState;
use uuid::Uuid;

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
    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    // 1. Get user
    let _user = state.user_repo.find_by_id(user_id).await.map_err(|e| e.to_string())?
        .ok_or("User not found")?;

    // 2. Call Backend API
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?;
    
    if let Some(s) = session {
        let client = reqwest::Client::new();
        let res = client
            .delete("http://localhost:3000/api/user/me")
            .header("Cookie", format!("session={}", s.access_token))
            .send()
            .await;

        match res {
            Ok(response) => {
                if !response.status().is_success() {
                    if response.status() == reqwest::StatusCode::UNAUTHORIZED {
                        return Err("Unauthorized to delete account on server. Please login again.".to_string());
                    }
                    return Err(format!("Failed to delete account on server: Status {}", response.status()));
                }
            },
            Err(e) => {
                return Err(format!("Failed to reach server to delete account: {}", e));
            }
        }
    }

    // 3. Local Deletion
    state.user_repo.delete(user_id).await.map_err(|e| e.to_string())?;
    let _ = state.session_repo.clear().await;

    Ok(DeleteAccountResponse { message: "Account deleted successfully".to_string() })
}

#[derive(serde::Serialize)]
pub struct UserProfileResponse {
    pub id: String,
    pub email: String,
    pub full_name: Option<String>,
    pub profile_picture: Option<String>,
    pub plan: String,
    pub created_at: String,
    pub has_password: bool,
}

#[tauri::command]
pub async fn get_current_user(state: State<'_, AppState>) -> Result<Option<UserProfileResponse>, String> {
    // 1. Get session
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?;
    
    if let Some(s) = session {
        // 2. Check expiry
        let now = chrono::Utc::now().timestamp();
        if s.expires_at <= now {
             let _ = state.session_repo.clear().await;
             return Ok(None);
        }
        
        // 3. Get user
        let user = state.user_repo.find_by_id(s.user_id).await.map_err(|e| e.to_string())?;
        
        if let Some(u) = user {
            Ok(Some(UserProfileResponse {
                id: u.id.to_string(),
                email: u.email,
                full_name: u.full_name,
                profile_picture: u.profile_picture,
                plan: u.plan,
                created_at: u.created_at.to_rfc3339(),
                has_password: !u.password_hash.is_empty(),
            }))
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn clear_session(state: State<'_, AppState>) -> Result<(), String> {
    state.session_repo.clear()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(serde::Deserialize)]
pub struct SyncSessionDto {
    pub user_id: String,
    pub access_token: String,
    pub expires_at: i64,
    pub google_access_token: Option<String>,
    pub google_refresh_token: Option<String>,
    pub google_token_expires_at: Option<i64>,
}

#[tauri::command]
pub async fn sync_session(dto: SyncSessionDto, state: State<'_, AppState>) -> Result<(), String> {
    use crate::domain::user::entity::session::Session;
    
    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;
    
    let session = Session {
        id: 1,
        user_id,
        access_token: dto.access_token,
        refresh_token: None,
        expires_at: dto.expires_at,
        google_access_token: dto.google_access_token,
        google_refresh_token: dto.google_refresh_token,
        google_token_expires_at: dto.google_token_expires_at,
    };
    
    state.session_repo.save(session).await.map_err(|e| e.to_string())?;
    log::info!("Session synced to SQLite for user: {}", user_id);
    Ok(())
}


#[tauri::command]
pub async fn clear_all_data(dto: ClearAllDataDto, state: State<'_, AppState>) -> Result<ClearAllDataResponse, String> {
    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id format: {}", e))?;

    state.maintenance_repo.clear_all_data(user_id)
        .await
        .map_err(|e| format!("Failed to clear all data: {}", e))?;

    Ok(ClearAllDataResponse { message: "All data cleared successfully".to_string() })
}

#[tauri::command]
pub async fn get_user_stats(state: State<'_, AppState>) -> Result<UserStats, String> {
    let stats = state.maintenance_repo.get_stats(Uuid::nil())
        .await
        .map_err(|e| e.to_string())?;

    Ok(stats)
}
