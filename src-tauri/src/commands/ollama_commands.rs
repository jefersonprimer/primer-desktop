use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModelDetails {
    pub format: String,
    pub family: String,
    pub families: Option<Vec<String>>,
    pub parameter_size: String,
    pub quantization_level: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
    pub size: i64,
    pub digest: String,
    pub details: OllamaModelDetails,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaTagsResponse {
    pub models: Vec<OllamaModel>,
}

#[tauri::command]
pub async fn get_ollama_models(url: Option<String>) -> Result<Vec<OllamaModel>, String> {
    let base_url = url.unwrap_or_else(|| "http://localhost:11434".to_string());
    let api_url = format!("{}/api/tags", base_url.trim_end_matches('/'));

    let client = Client::new();
    let response = client
        .get(&api_url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama API returned error: {}", response.status()));
    }

    let tags_response: OllamaTagsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    Ok(tags_response.models)
}
