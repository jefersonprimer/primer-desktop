use sqlx::PgPool;
use anyhow::Result;

pub async fn connect_pg(database_url: &str) -> Result<PgPool> {
    let pool = PgPool::connect(database_url).await?;
    Ok(pool)
}

pub async fn migrate_pg(_pool: &PgPool) -> Result<()> {
    // Migrations are now managed by the backend (Next.js app), not the desktop client.
    // This prevents distributed schema changes and security issues.
    log::info!("Skipping Postgres migrations on Desktop Client (Managed by Backend).");
    Ok(())
}
