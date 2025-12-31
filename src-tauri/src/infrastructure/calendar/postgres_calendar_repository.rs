use async_trait::async_trait;
use sqlx::{Postgres, Pool, Row};
use anyhow::{Result, anyhow};
use uuid::Uuid;
use crate::domain::calendar::{
    entity::GoogleCalendarEvent,
    repository::CalendarRepository,
};

pub struct PostgresCalendarRepository {
    pool: Pool<Postgres>,
}

impl PostgresCalendarRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl CalendarRepository for PostgresCalendarRepository {
    async fn save(&self, event: GoogleCalendarEvent) -> Result<GoogleCalendarEvent> {
        sqlx::query(
            r#"
            INSERT INTO google_calendar_events (
                id, user_id, google_event_id, calendar_id, title, description,
                start_at, end_at, timezone, created_by, source_chat_id, status,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (user_id, google_event_id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                start_at = EXCLUDED.start_at,
                end_at = EXCLUDED.end_at,
                status = EXCLUDED.status,
                updated_at = EXCLUDED.updated_at
            RETURNING *
            "#
        )
        .bind(event.id)
        .bind(event.user_id)
        .bind(event.google_event_id)
        .bind(event.calendar_id)
        .bind(event.title)
        .bind(event.description)
        .bind(event.start_at)
        .bind(event.end_at)
        .bind(event.timezone)
        .bind(event.created_by)
        .bind(event.source_chat_id)
        .bind(event.status)
        .bind(event.created_at)
        .bind(event.updated_at)
        .map(|row: sqlx::postgres::PgRow| {
             GoogleCalendarEvent {
                id: row.get("id"),
                user_id: row.get("user_id"),
                google_event_id: row.get("google_event_id"),
                calendar_id: row.get("calendar_id"),
                title: row.get("title"),
                description: row.get("description"),
                start_at: row.get("start_at"),
                end_at: row.get("end_at"),
                timezone: row.get("timezone"),
                created_by: row.get("created_by"),
                source_chat_id: row.get("source_chat_id"),
                status: row.get("status"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        })
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to save calendar event: {}", e))
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<GoogleCalendarEvent>> {
        let events = sqlx::query_as::<_, GoogleCalendarEvent>(
            r#"
            SELECT * FROM google_calendar_events
            WHERE user_id = $1
            ORDER BY start_at ASC
            "#
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to fetch calendar events: {}", e))?;

        Ok(events)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<GoogleCalendarEvent>> {
        let event = sqlx::query_as::<_, GoogleCalendarEvent>(
            r#"
            SELECT * FROM google_calendar_events
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to fetch calendar event: {}", e))?;

        Ok(event)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM google_calendar_events
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete calendar event: {}", e))?;

        Ok(())
    }
}
