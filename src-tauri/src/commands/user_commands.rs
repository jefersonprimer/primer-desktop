use tauri::State;
use crate::domain::user::{
    usecase::{
        login::LoginUseCase,
        google_login::GoogleLoginUseCase,
        register::RegisterUseCase,
        reset_password::ResetPasswordUseCase,
        add_api_key::AddApiKeyUseCase,
        get_api_keys::GetApiKeysUseCase,
        delete_api_key::DeleteApiKeyUseCase,
        delete_account::DeleteAccountUseCase,
    },
    dto::{
        LoginDto, LoginResponse,
        GoogleLoginDto, GoogleLoginResponse,
        RegisterDto, RegisterResponse,
        ResetPasswordDto, ResetPasswordResponse,
        AddApiKeyDto, AddApiKeyResponse,
        GetApiKeysDto, GetApiKeysResponse, ApiKeyDto,
        DeleteApiKeyDto, DeleteApiKeyResponse,
        DeleteAccountDto, DeleteAccountResponse,
        SessionResponse, ClearSessionResponse,
        GetShortcutsDto, GetShortcutsResponse, ShortcutDto,
        ClearAllDataDto, ClearAllDataResponse,
    },
};
use crate::domain::maintenance::entity::UserStats;
use crate::app_state::AppState;
use uuid::Uuid;

#[derive(serde::Serialize)]
pub struct GoogleAuthUrlResponse {
    pub url: String,
}

#[tauri::command]
pub async fn get_google_auth_url() -> Result<GoogleAuthUrlResponse, String> {
    use std::env;
    
    // Ensure .env is loaded (usually done in main, but good to ensure)
    // dotenvy::dotenv().ok(); // Assuming it's loaded in main

    let client_id = env::var("GOOGLE_CLIENT_ID")
        .map_err(|_| "GOOGLE_CLIENT_ID not set in .env".to_string())?;
    
    let redirect_uri = "http://localhost:5173/auth/callback";
    let scope = "email profile openid https://www.googleapis.com/auth/calendar.events";
    let response_type = "code"; // Authorization Code Flow for refresh tokens
    let access_type = "offline"; // Request refresh token

    let url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type={}&scope={}&access_type={}&prompt=consent",
        client_id, redirect_uri, response_type, scope, access_type
    );

    Ok(GoogleAuthUrlResponse { url })
}

#[tauri::command]
pub async fn google_login(dto: GoogleLoginDto, state: State<'_, AppState>) -> Result<GoogleLoginResponse, String> {
    let google_login_usecase = GoogleLoginUseCase::new(
        state.user_repo.clone(),
        state.token_generator.clone(),
        state.session_repo.clone(),
    );

    google_login_usecase.execute(
        dto.email, 
        dto.google_id, 
        dto.name, 
        dto.picture, 
        dto.google_access_token,
        dto.google_refresh_token,
        dto.google_token_expires_at,
    )
        .await
        .map(|(token, user_id)| GoogleLoginResponse { token, user_id })
        .map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct ExchangeGoogleCodeDto {
    pub code: String,
}

#[derive(serde::Serialize)]
pub struct ExchangeGoogleCodeResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: i64,
}

#[tauri::command]
pub async fn exchange_google_code(dto: ExchangeGoogleCodeDto) -> Result<ExchangeGoogleCodeResponse, String> {
    use std::env;

    let client_id = env::var("GOOGLE_CLIENT_ID")
        .map_err(|_| "GOOGLE_CLIENT_ID not set in .env".to_string())?;
    let client_secret = env::var("GOOGLE_CLIENT_SECRET")
        .map_err(|_| "GOOGLE_CLIENT_SECRET not set in .env. Required for Authorization Code Flow.".to_string())?;
    
    let redirect_uri = "http://localhost:5173/auth/callback";

    let client = reqwest::Client::new();
    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("code", dto.code.as_str()),
        ("grant_type", "authorization_code"),
        ("redirect_uri", redirect_uri),
    ];

    let res = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Failed to exchange code: {}", e))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Google token exchange error: {}", error_text));
    }

    #[derive(serde::Deserialize)]
    struct GoogleTokenResponse {
        access_token: String,
        refresh_token: Option<String>,
        expires_in: i64,
    }

    let token_response: GoogleTokenResponse = res.json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    Ok(ExchangeGoogleCodeResponse {
        access_token: token_response.access_token,
        refresh_token: token_response.refresh_token,
        expires_in: token_response.expires_in,
    })
}

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
                google_access_token: s.google_access_token,
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
    // We can use a dummy UUID if we just count everything in SQLite, 
    // or extract it from session if we want per-user stats in the future.
    // For now, local sqlite is single user mostly or we count global.
    // Let's just pass a dummy one or grab from session if needed.
    // But since get_stats implementation ignores user_id for now...
    
    let stats = state.maintenance_repo.get_stats(Uuid::nil())
        .await
        .map_err(|e| e.to_string())?;

    Ok(stats)
}

#[tauri::command]
pub async fn get_shortcuts(dto: GetShortcutsDto, _state: State<'_, AppState>) -> Result<GetShortcutsResponse, String> {
    // Return fixed hardcoded shortcuts
    let shortcuts = vec![
        ShortcutDto {
            id: "fixed-ask".to_string(),
            user_id: dto.user_id.clone(),
            action: "ask".to_string(),
            keys: "Ctrl + Enter".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        },
        ShortcutDto {
            id: "fixed-screenshot".to_string(),
            user_id: dto.user_id.clone(),
            action: "screenshot".to_string(),
            keys: "Ctrl + E".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        },
        ShortcutDto {
            id: "fixed-voice".to_string(),
            user_id: dto.user_id.clone(),
            action: "voice".to_string(),
            keys: "Ctrl + D".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        },
        ShortcutDto {
            id: "fixed-hide".to_string(),
            user_id: dto.user_id.clone(),
            action: "hide".to_string(),
            keys: "Ctrl + \\".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        },
    ];

    Ok(GetShortcutsResponse { shortcuts })
}
