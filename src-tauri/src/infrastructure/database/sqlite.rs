use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool, migrate::Migrator};
use anyhow::Result;
use std::path::Path;
use std::fs;
use std::str::FromStr;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations/sqlite");

pub async fn connect_sqlite(database_url: &str) -> Result<SqlitePool> {
    // Ensure the directory for the SQLite file exists
    let db_path = Path::new(database_url.trim_start_matches("sqlite:"));
    if let Some(parent_dir) = db_path.parent() {
        if !parent_dir.as_os_str().is_empty() && !parent_dir.exists() {
            fs::create_dir_all(parent_dir)?;
        }
    }

    let options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await?;

    Ok(pool)
}

pub async fn migrate_sqlite(pool: &SqlitePool) -> Result<()> {
    MIGRATOR.run(pool).await?;
    Ok(())
}
