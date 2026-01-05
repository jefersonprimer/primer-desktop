use serde::{Deserialize, Serialize};

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
pub struct ClearAllDataDto {
    pub user_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ClearAllDataResponse {
    pub message: String,
}
