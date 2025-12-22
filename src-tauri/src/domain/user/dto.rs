use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ResetPasswordDto {
    pub token: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ResetPasswordResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AddApiKeyDto {
    pub user_id: String,
    pub provider: String,
    pub api_key: String,
    pub selected_model: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AddApiKeyResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteApiKeyDto {
    pub user_id: String,
    pub api_key_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteApiKeyResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ApiKeyDto {
    pub id: String,
    pub user_id: String,
    pub provider: String,
    pub api_key: String,
    pub selected_model: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetApiKeysDto {
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetApiKeysResponse {
    pub api_keys: Vec<ApiKeyDto>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteAccountDto {
    pub user_id: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteAccountResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SessionResponse {
    pub user_id: String,
    pub access_token: String,
    pub expires_at: i64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ClearSessionResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ShortcutDto {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub keys: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetShortcutsDto {
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetShortcutsResponse {
    pub shortcuts: Vec<ShortcutDto>,
}
