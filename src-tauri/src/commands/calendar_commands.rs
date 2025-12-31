use tauri::State;
use crate::app_state::AppState;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::domain::calendar::usecase::create_event::CreateEventUseCase;
use crate::domain::calendar::usecase::delete_event::DeleteEventUseCase;
use crate::domain::calendar::usecase::list_events::ListEventsUseCase;

#[derive(Debug, Deserialize)]
pub struct CreateCalendarEventDto {
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String, // ISO 8601
    pub end_at: String,   // ISO 8601
    pub source_chat_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteCalendarEventDto {
    pub user_id: String,
    pub event_id: String,
}

#[tauri::command]
pub async fn delete_calendar_event(dto: DeleteCalendarEventDto, state: State<'_, AppState>) -> Result<(), String> {
    let delete_event_usecase = DeleteEventUseCase::new(
        state.calendar_repo.clone(),
        state.session_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id: {}", e))?;
    
    let event_id = Uuid::parse_str(&dto.event_id)
        .map_err(|e| format!("Invalid event_id: {}", e))?;

    delete_event_usecase.execute(user_id, event_id)
        .await
        .map_err(|e| {
            log::error!("Failed to delete calendar event: {}", e);
            e.to_string()
        })?;

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
    let create_event_usecase = CreateEventUseCase::new(
        state.calendar_repo.clone(),
        state.session_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id: {}", e))?;
    
    let source_chat_id = dto.source_chat_id
        .map(|id| Uuid::parse_str(&id).map_err(|e| format!("Invalid chat_id: {}", e)))
        .transpose()?;

    let start_at = DateTime::parse_from_rfc3339(&dto.start_at)
        .map_err(|e| format!("Invalid start_at: {}", e))?
        .with_timezone(&Utc);

    let end_at = DateTime::parse_from_rfc3339(&dto.end_at)
        .map_err(|e| format!("Invalid end_at: {}", e))?
        .with_timezone(&Utc);

    let event = create_event_usecase.execute(
        user_id,
        dto.title,
        dto.description,
        start_at,
        end_at,
        source_chat_id
    ).await.map_err(|e| e.to_string())?;

    Ok(CreateCalendarEventResponse {
        event_id: event.id.to_string(),
        google_event_id: event.google_event_id,
        status: event.status,
    })
}

#[derive(Debug, Deserialize)]
pub struct GetCalendarEventsDto {
    pub user_id: String,
}

#[derive(Debug, Serialize)]
pub struct CalendarEventDto {
    pub id: String,
    pub google_event_id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String,
    pub end_at: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct GetCalendarEventsResponse {
    pub events: Vec<CalendarEventDto>,
}

#[tauri::command]
pub async fn get_calendar_events(dto: GetCalendarEventsDto, state: State<'_, AppState>) -> Result<GetCalendarEventsResponse, String> {
    let list_events_usecase = ListEventsUseCase::new(
        state.calendar_repo.clone(),
        state.session_repo.clone(),
    );

    let user_id = Uuid::parse_str(&dto.user_id)
        .map_err(|e| format!("Invalid user_id: {}", e))?;

    let events = list_events_usecase.execute(user_id)
        .await
        .map_err(|e| e.to_string())?;

    let event_dtos = events.into_iter().map(|e| CalendarEventDto {
        id: e.id.to_string(),
        google_event_id: e.google_event_id,
        title: e.title,
        description: e.description,
        start_at: e.start_at.to_rfc3339(),
        end_at: e.end_at.to_rfc3339(),
        status: e.status,
    }).collect();

    Ok(GetCalendarEventsResponse { events: event_dtos })
}
