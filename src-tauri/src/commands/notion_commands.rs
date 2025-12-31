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
    user_id: Option<String>,
) -> Result<NotionStatus, String> {
    log::info!("get_notion_status called for user_id: {:?}", user_id);
    
    // In a real app we would get the user_id from the session/token passed in header/command
    // For now we assume the frontend passes it or we fail if missing.
    // However, often we might get it from a sessionService using a token.
    // If user_id is passed, use it.
    
    let uid = if let Some(id) = user_id {
        Uuid::parse_str(&id).map_err(|e| e.to_string())?
    } else {
        // Retrieve generic user (e.g. first user) or handle error. 
        // For simplicity, let's assume the frontend MUST pass the user_id for now, 
        // or we rely on some other context.
        return Err("User ID required".to_string());
    };

    let integration = state.notion_repo.find_by_user_id(uid)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(integration) = integration {
        log::info!("Notion integration found for user {}", uid);
        Ok(NotionStatus {
            is_connected: true,
            workspace_name: integration.workspace_name,
        })
    } else {
        log::info!("No Notion integration found for user {}", uid);
        Ok(NotionStatus {
            is_connected: false,
            workspace_name: None,
        })
    }
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

#[derive(serde::Serialize)]
pub struct NotionPage {
    pub id: String,
    pub title: String,
    pub url: String,
    pub last_edited_time: String,
}

#[tauri::command]
pub async fn get_notion_pages(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<NotionPage>, String> {
    let uid = Uuid::parse_str(&user_id).map_err(|e| e.to_string())?;

    let integration = state.notion_repo.find_by_user_id(uid)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Notion not connected")?;

    let results = state.notion_client.search(&integration.access_token, None)
        .await
        .map_err(|e| e.to_string())?;

    let pages = results.into_iter().map(|page| {
        let mut title = "Untitled".to_string();
        if let Some(props) = &page.properties {
             if let Some(props_map) = props.as_object() {
                 for (_, val) in props_map {
                     if let Some(type_str) = val.get("type").and_then(|t| t.as_str()) {
                         if type_str == "title" {
                             if let Some(title_arr) = val.get("title").and_then(|t| t.as_array()) {
                                 if let Some(first) = title_arr.first() {
                                     if let Some(plain_text) = first.get("plain_text").and_then(|t| t.as_str()) {
                                         title = plain_text.to_string();
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
        }

        NotionPage {
            id: page.id,
            title,
            url: page.url,
            last_edited_time: page.last_edited_time,
        }
    }).collect();

    Ok(pages)
}

#[tauri::command]
pub async fn create_notion_page(
    state: State<'_, AppState>,
    user_id: String,
    title: String,
    content: String,
    parent_page_id: Option<String>, 
) -> Result<String, String> {
    let uid = Uuid::parse_str(&user_id).map_err(|e| e.to_string())?;

    let integration = state.notion_repo.find_by_user_id(uid)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Notion not connected")?;
    
    // Determine parent. If not provided, we might need a default or duplicated_template_id?
    // The integration response has `duplicated_template_id` which acts as a root page if the user duplicated a template.
    let parent = parent_page_id.or(integration.duplicated_template_id).ok_or("No parent page ID available")?;

    let page_id = state.notion_client.create_page(&integration.access_token, &parent, &title, &content)
        .await
        .map_err(|e| e.to_string())?;

    Ok(page_id)
}
