use async_trait::async_trait;
use sqlx::PgPool;
use crate::domain::changelog::{entity::Changelog, repository::ChangelogRepository};

pub struct PostgresChangelogRepository {
    pool: PgPool,
}

impl PostgresChangelogRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ChangelogRepository for PostgresChangelogRepository {
    async fn get_all(&self) -> anyhow::Result<Vec<Changelog>> {
        let changelogs = sqlx::query_as::<_, Changelog>(
            r#"
            SELECT
                id,
                title,
                content,
                published_at,
                created_at,
                updated_at
            FROM changelogs
            ORDER BY published_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(changelogs)
    }
}