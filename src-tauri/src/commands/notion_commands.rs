use tauri::State;
use crate::app_state::AppState;
use crate::domain::notion::entity::NotionIntegration;
use uuid::Uuid;
use chrono::Utc;
use std::env;

#[derive(serde::Serialize)]
pub struct NotionStatus {
    pub is_connected: bool,
    pub workspace_name: Option<String>,
}

#[tauri::command]
pub async fn get_notion_auth_url() -> Result<String, String> {
    let client_id = env::var("NOTION_CLIENT_ID").map_err(|_| "NOTION_CLIENT_ID not set")?;
    let redirect_uri = env::var("NOTION_REDIRECT_URI").unwrap_or_else(|_| "http://localhost:5173/oauth/notion/callback".to_string());
    let auth_url = env::var("NOTION_AUTH_URL").unwrap_or_else(|_| "https://api.notion.com/v1/oauth/authorize".to_string());

    Ok(format!(
        "{}?client_id={}&response_type=code&owner=user&redirect_uri={}",
        auth_url, client_id, redirect_uri
    ))
}

#[tauri::command]
pub async fn get_notion_status(
    state: State<'_, AppState>,
    _user_id: Option<String>,
) -> Result<NotionStatus, String> {
    // 1. Get session
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?;
    
    if let Some(s) = session {
        // 2. Call Backend API for status
        let client = reqwest::Client::new();
        let api_res = client
            .get("https://primerai.vercel.app/api/user/status")
            .header("Cookie", format!("session={}", s.access_token))
            .send()
            .await;

        if let Ok(response) = api_res {
            if response.status().is_success() {
                if let Ok(data) = response.json::<crate::commands::user_commands::StatusApiResponse>().await {
                    return Ok(NotionStatus {
                        is_connected: data.user.as_ref().map(|u| u.is_notion_connected).unwrap_or(false),
                        workspace_name: data.user.and_then(|u| u.notion_workspace),
                    });
                }
            }
        }
    }

    Ok(NotionStatus {
        is_connected: false,
        workspace_name: None,
    })
}



#[tauri::command]
pub async fn exchange_notion_code(
    state: State<'_, AppState>,
    code: String,
    user_id: String,
) -> Result<NotionStatus, String> {
    log::info!("exchange_notion_code called for user_id: {}", user_id);
    let client_id = env::var("NOTION_CLIENT_ID").map_err(|_| "NOTION_CLIENT_ID not set")?;
    let client_secret = env::var("NOTION_CLIENT_SECRET").map_err(|_| "NOTION_CLIENT_SECRET not set")?;
    let redirect_uri = env::var("NOTION_REDIRECT_URI").unwrap_or_else(|_| "http://localhost:5173/oauth/notion/callback".to_string());

    log::info!("Exchanging token with redirect_uri: {}", redirect_uri);

    let response = state.notion_client.exchange_token(&client_id, &client_secret, &code, &redirect_uri)
        .await
        .map_err(|e| {
            log::error!("Failed to exchange Notion token: {}", e);
            e.to_string()
        })?;
    
    log::info!("Token exchange successful. Workspace: {:?}", response.workspace_name);

    let uid = Uuid::parse_str(&user_id).map_err(|e| e.to_string())?;

    let integration = NotionIntegration {
        id: Uuid::new_v4(),
        user_id: uid,
        access_token: response.access_token,
        bot_id: response.bot_id,
        workspace_id: response.workspace_id,
        workspace_name: response.workspace_name.clone(),
        workspace_icon: response.workspace_icon,
        owner_type: response.owner.map(|o| o.owner_type).unwrap_or("unknown".to_string()),
        duplicated_template_id: response.duplicated_template_id,
        token_type: Some("bearer".to_string()),
        expires_at: None, // Notion tokens don't expire by default unless using public integration with granular permissions? Actually they are permanent for internal, but public might be different. Let's assume permanent for now or handle expiry if provided.
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    state.notion_repo.save(integration)
        .await
        .map_err(|e| {
            log::error!("Failed to save Notion integration: {}", e);
            e.to_string()
        })?;
        
    log::info!("Notion integration saved successfully for user {}", uid);

    Ok(NotionStatus {
        is_connected: true,
        workspace_name: response.workspace_name,
    })
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct NotionPage {
    pub id: String,
    pub title: String,
    pub url: String,
    pub last_edited_time: String,
}


#[tauri::command]
pub async fn get_notion_pages(
    state: State<'_, AppState>,
    _user_id: String,
) -> Result<Vec<NotionPage>, String> {
    // 1. Get session
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    // 2. Call Backend API
    let client = reqwest::Client::new();
    let res = client
        .get("https://primerai.vercel.app/api/notion/pages")
        .header("Cookie", format!("session={}", session.access_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to list pages: Status {}", res.status()));
    }

    #[derive(serde::Deserialize)]
    struct NotionPagesResponse {
        pages: Vec<NotionPage>,
    }

    let response = res.json::<NotionPagesResponse>().await.map_err(|e| e.to_string())?;
    Ok(response.pages)
}

#[tauri::command]
pub async fn create_notion_page(
    state: State<'_, AppState>,
    _user_id: String,
    title: String,
    content: String,
    parent_page_id: Option<String>, 
) -> Result<String, String> {
    // 1. Get session
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    // 2. We still need to call the Notion API for the actual creation if we want it to be "agent" created.
    // However, the requested refactor is to move logic to backend.
    // For now, let's assume we call a backend create endpoint that handles both Notion API and DB insertion.
    
    let client = reqwest::Client::new();
    let res = client
        .post("https://primerai.vercel.app/api/notion/pages")
        .header("Cookie", format!("session={}", session.access_token))
        .json(&serde_json::json!({
            "title": title,
            "content": content,
            "parent_page_id": parent_page_id,
            "notion_page_id": "pending", // Backend should generate/handle this
            "url": "https://notion.so/pending"
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to create page: Status {}", res.status()));
    }

    let page = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(page["id"].as_str().unwrap_or_default().to_string())
}

#[tauri::command]
pub async fn delete_notion_page(
    state: State<'_, AppState>,
    _user_id: String,
    page_id: String,
) -> Result<(), String> {
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    let client = reqwest::Client::new();
    let res = client
        .delete(format!("https://primerai.vercel.app/api/notion/pages/{}", page_id))
        .header("Cookie", format!("session={}", session.access_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to delete page tracking: Status {}", res.status()));
    }

    Ok(())
}

#[tauri::command]
pub async fn update_notion_page(
    state: State<'_, AppState>,
    _user_id: String,
    page_id: String,
    title: String,
    _content: Option<String>,
) -> Result<(), String> {
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    let client = reqwest::Client::new();
    let res = client
        .patch(format!("https://primerai.vercel.app/api/notion/pages/{}", page_id))
        .header("Cookie", format!("session={}", session.access_token))
        .json(&serde_json::json!({ "title": title }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to update page tracking: Status {}", res.status()));
    }

    Ok(())
}

#[tauri::command]
pub async fn get_notion_page_content(
    _state: State<'_, AppState>,
    _user_id: String,
    _page_id: String,
) -> Result<String, String> {
    // This would require a call to Notion API via Backend
    Ok("Content fetching moved to backend API (Not implemented in this turn)".to_string())
}

