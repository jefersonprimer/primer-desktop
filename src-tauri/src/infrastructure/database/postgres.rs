use sqlx::PgPool;
use anyhow::Result;

pub async fn connect_pg(database_url: &str) -> Result<PgPool> {
    let pool = PgPool::connect(database_url).await?;
    Ok(pool)
}

pub async fn migrate_pg(pool: &PgPool) -> Result<()> {
    sqlx::migrate!("./migrations/postgres")
        .run(pool)
        .await?;
    Ok(())
}
