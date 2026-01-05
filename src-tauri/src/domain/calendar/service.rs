use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateEventPayload {
    pub summary: String,
    pub description: Option<String>,
    pub start: EventDateTime,
    pub end: EventDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventDateTime {
    #[serde(rename = "dateTime")]
    pub date_time: String, // RFC3339 format
    #[serde(rename = "timeZone")]
    pub time_zone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleEventResponse {
    pub id: String,
    pub status: String,
    #[serde(rename = "htmlLink")]
    pub html_link: String,
}

#[derive(Debug, Deserialize)]
pub struct GoogleEvent {
    pub id: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub start: Option<GoogleEventTime>,
    pub end: Option<GoogleEventTime>,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct GoogleEventTime {
    #[serde(rename = "dateTime")]
    pub date_time: Option<String>,
    pub date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleEventListResponse {
    pub items: Vec<GoogleEvent>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleCalendarListEntry {
    pub id: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "primary")]
    pub is_primary: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleCalendarListResponse {
    pub items: Vec<GoogleCalendarListEntry>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleTokenResponse {
    pub access_token: String,
    pub expires_in: i64,
    pub scope: String,
    pub token_type: String,
    pub id_token: Option<String>,
}

pub struct GoogleCalendarService;

impl GoogleCalendarService {
    pub async fn refresh_access_token(refresh_token: &str, client_id: &str, client_secret: &str) -> Result<GoogleTokenResponse> {
        let client = reqwest::Client::new();
        let params = [
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
        ];

        let res = client
            .post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await?;

        if !res.status().is_success() {
            let error_text = res.text().await?;
            return Err(anyhow!("Google token refresh error: {}", error_text));
        }

        let token_response = res.json::<GoogleTokenResponse>().await?;
        Ok(token_response)
    }

    pub async fn create_event(access_token: &str, payload: CreateEventPayload) -> Result<GoogleEventResponse> {
        let client = reqwest::Client::new();
        let res = client
            .post("https://www.googleapis.com/calendar/v3/calendars/primary/events")
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !res.status().is_success() {
            let error_text = res.text().await?;
            return Err(anyhow!("Google Calendar API error: {}", error_text));
        }

        let event = res.json::<GoogleEventResponse>().await?;
        Ok(event)
    }

    pub async fn list_calendars(access_token: &str) -> Result<Vec<GoogleCalendarListEntry>> {
        let client = reqwest::Client::new();
        let res = client
            .get("https://www.googleapis.com/calendar/v3/users/me/calendarList")
            .header("Authorization", format!("Bearer {}", access_token))
            .send()
            .await?;

        if !res.status().is_success() {
            let error_text = res.text().await?;
            return Err(anyhow!("Google Calendar API error (list_calendars): {}", error_text));
        }

        let list_response = res.json::<GoogleCalendarListResponse>().await?;
        Ok(list_response.items)
    }

    pub async fn list_events(access_token: &str, calendar_id: &str) -> Result<Vec<GoogleEvent>> {
        let client = reqwest::Client::new();
        // URL encode the calendar_id just in case, though usually valid chars
        let encoded_id = urlencoding::encode(calendar_id);
        let url = format!("https://www.googleapis.com/calendar/v3/calendars/{}/events", encoded_id);
        
        let res = client
            .get(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .query(&[("singleEvents", "true"), ("orderBy", "startTime")]) // Expand recurring events
            .send()
            .await?;

        if !res.status().is_success() {
            let error_text = res.text().await?;
            return Err(anyhow!("Google Calendar API error (list_events for {}): {}", calendar_id, error_text));
        }

        let list_response = res.json::<GoogleEventListResponse>().await?;
        Ok(list_response.items)
    }

    pub async fn delete_event(access_token: &str, calendar_id: &str, event_id: &str) -> Result<()> {
        let client = reqwest::Client::new();
        let url = format!("https://www.googleapis.com/calendar/v3/calendars/{}/events/{}", calendar_id, event_id);
        
        log::info!("Deleting Google Event: URL={}", url);

        let res = client
            .delete(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .send()
            .await?;

        let status = res.status();
        log::info!("Google Delete Response Status: {}", status);

        if !status.is_success() {
             // 410 Gone means it's already deleted, so we can consider it a success or ignore it
             if status.as_u16() == 410 || status.as_u16() == 404 {
                 log::warn!("Event already deleted on Google (404/410)");
                 return Ok(());
             }
            let error_text = res.text().await?;
            log::error!("Google API Error Body: {}", error_text);
            return Err(anyhow!("Google Calendar API error: {} - {}", status, error_text));
        }

        Ok(())
    }

    pub async fn update_event(access_token: &str, calendar_id: &str, event_id: &str, payload: CreateEventPayload) -> Result<GoogleEventResponse> {
        let client = reqwest::Client::new();
        let url = format!("https://www.googleapis.com/calendar/v3/calendars/{}/events/{}", calendar_id, event_id);
        
        log::info!("Updating Google Event: URL={}", url);

        let res = client
            .patch(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        let status = res.status();
        log::info!("Google Update Response Status: {}", status);

        if !status.is_success() {
            let error_text = res.text().await?;
            log::error!("Google API Error Body: {}", error_text);
            return Err(anyhow!("Google Calendar API error: {} - {}", status, error_text));
        }

        let event = res.json::<GoogleEventResponse>().await?;
        Ok(event)
    }
}