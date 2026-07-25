use sqlx::SqlitePool;
use tauri::State;

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
