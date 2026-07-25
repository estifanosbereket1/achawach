use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use std::path::Path;

pub async fn init_pool(app_data_dir: &Path) -> Result<SqlitePool, String> {
    std::fs::create_dir_all(app_data_dir).map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("achawatch.db");
    let url = format!("sqlite://{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .connect(&url)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(pool)
}
