use serde::Serialize;
use sqlx::{Row, SqlitePool};
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyPlayCount {
    pub path: String,
    pub count: i64,
}

#[tauri::command]
pub async fn record_play(pool: State<'_, SqlitePool>, path: String) -> Result<(), String> {
    let track_id: Option<i64> = sqlx::query_scalar("SELECT id FROM tracks WHERE path = ?")
        .bind(&path)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    let Some(track_id) = track_id else {
        // Track may have been removed from the library mid-playback; nothing to record.
        return Ok(());
    };

    sqlx::query("UPDATE tracks SET play_count = play_count + 1, last_played = datetime('now') WHERE id = ?")
        .bind(track_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO play_history (track_id, played_at) VALUES (?, datetime('now'))")
        .bind(track_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_monthly_play_counts(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<MonthlyPlayCount>, String> {
    let rows = sqlx::query(
        "SELECT t.path AS path, COUNT(*) AS count
         FROM play_history ph
         JOIN tracks t ON t.id = ph.track_id
         WHERE ph.played_at >= date('now', 'start of month')
         GROUP BY t.id
         ORDER BY count DESC",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    rows.iter()
        .map(|row| {
            Ok(MonthlyPlayCount {
                path: row.try_get("path")?,
                count: row.try_get("count")?,
            })
        })
        .collect::<Result<Vec<_>, sqlx::Error>>()
        .map_err(|e| e.to_string())
}
