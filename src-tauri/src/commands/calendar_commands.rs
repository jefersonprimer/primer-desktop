use tauri::State;
use crate::app_state::AppState;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateCalendarEventDto {
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String, // ISO 8601
    pub end_at: String,   // ISO 8601
    pub source_chat_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteCalendarEventDto {
    pub user_id: String,
    pub event_id: String,
}


#[tauri::command]
pub async fn delete_calendar_event(dto: DeleteCalendarEventDto, state: State<'_, AppState>) -> Result<(), String> {
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    let client = reqwest::Client::new();
    let res = client
        .delete(format!("https://primerai.vercel.app/api/calendar/{}", dto.event_id))
        .header("Cookie", format!("session={}", session.access_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to delete event: Status {}", res.status()));
    }

    Ok(())
}

#[derive(Debug, Serialize)]
pub struct CreateCalendarEventResponse {
    pub event_id: String,
    pub google_event_id: String,
    pub status: String,
}

#[tauri::command]
pub async fn create_calendar_event(dto: CreateCalendarEventDto, state: State<'_, AppState>) -> Result<CreateCalendarEventResponse, String> {
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    let client = reqwest::Client::new();
    let res = client
        .post("https://primerai.vercel.app/api/calendar")
        .header("Cookie", format!("session={}", session.access_token))
        .json(&dto)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to create event: Status {}", res.status()));
    }

    let event = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    
    Ok(CreateCalendarEventResponse {
        event_id: event["id"].as_str().unwrap_or_default().to_string(),
        google_event_id: event["google_event_id"].as_str().unwrap_or_default().to_string(),
        status: event["status"].as_str().unwrap_or_default().to_string(),
    })
}

#[derive(Debug, Deserialize)]
pub struct GetCalendarEventsDto {
    pub user_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalendarEventDto {
    pub id: String,
    pub google_event_id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String,
    pub end_at: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetCalendarEventsResponse {
    pub events: Vec<CalendarEventDto>,
}

#[tauri::command]
pub async fn get_calendar_events(_dto: GetCalendarEventsDto, state: State<'_, AppState>) -> Result<GetCalendarEventsResponse, String> {
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    let client = reqwest::Client::new();
    let res = client
        .get("https://primerai.vercel.app/api/calendar")
        .header("Cookie", format!("session={}", session.access_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to list events: Status {}", res.status()));
    }

    let response = res.json::<GetCalendarEventsResponse>().await.map_err(|e| e.to_string())?;
    Ok(response)
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateCalendarEventDto {
    pub user_id: String,
    pub event_id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String, // ISO 8601
    pub end_at: String,   // ISO 8601
}


#[tauri::command]
pub async fn update_calendar_event(dto: UpdateCalendarEventDto, state: State<'_, AppState>) -> Result<CalendarEventDto, String> {
    let session = state.session_repo.get().await.map_err(|e| e.to_string())?
        .ok_or("Unauthorized: No session found")?;

    let client = reqwest::Client::new();
    let res = client
        .patch(format!("https://primerai.vercel.app/api/calendar/{}", dto.event_id))
        .header("Cookie", format!("session={}", session.access_token))
        .json(&dto)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to update event: Status {}", res.status()));
    }

    let event = res.json::<CalendarEventDto>().await.map_err(|e| e.to_string())?;
    Ok(event)
}

