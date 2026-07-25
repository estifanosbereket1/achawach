use crate::library::{fetch_library, Track};
use serde::Serialize;
use sqlx::{Row, SqlitePool};
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistSummary {
    pub id: i64,
    pub name: String,
    pub track_count: i64,
}

#[tauri::command]
pub async fn get_playlists(pool: State<'_, SqlitePool>) -> Result<Vec<PlaylistSummary>, String> {
    let rows = sqlx::query(
        "SELECT p.id AS id, p.name AS name, COUNT(pt.id) AS track_count
         FROM playlists p
         LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
         GROUP BY p.id
         ORDER BY p.created_at DESC",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    rows.iter()
        .map(|row| {
            Ok(PlaylistSummary {
                id: row.try_get("id")?,
                name: row.try_get("name")?,
                track_count: row.try_get("track_count")?,
            })
        })
        .collect::<Result<Vec<_>, sqlx::Error>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_playlist(pool: State<'_, SqlitePool>, name: String) -> Result<i64, String> {
    let result = sqlx::query("INSERT INTO playlists (name, created_at) VALUES (?, datetime('now'))")
        .bind(name)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn rename_playlist(
    pool: State<'_, SqlitePool>,
    playlist_id: i64,
    name: String,
) -> Result<(), String> {
    sqlx::query("UPDATE playlists SET name = ? WHERE id = ?")
        .bind(name)
        .bind(playlist_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_playlist(pool: State<'_, SqlitePool>, playlist_id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM playlists WHERE id = ?")
        .bind(playlist_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_playlist_tracks(
    pool: State<'_, SqlitePool>,
    playlist_id: i64,
) -> Result<Vec<Track>, String> {
    let paths: Vec<String> = sqlx::query_scalar(
        "SELECT t.path FROM playlist_tracks pt
         JOIN tracks t ON t.id = pt.track_id
         WHERE pt.playlist_id = ?
         ORDER BY pt.position",
    )
    .bind(playlist_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let library = fetch_library(pool.inner()).await?;
    let by_path: std::collections::HashMap<&str, &Track> =
        library.iter().map(|t| (t.path.as_str(), t)).collect();

    Ok(paths
        .iter()
        .filter_map(|p| by_path.get(p.as_str()).map(|t| (*t).clone()))
        .collect())
}

/// Replaces a playlist's full track list and ordering in one step. Used
/// uniformly for adding, removing, and reordering tracks — the frontend
/// computes the desired final order and this just persists it, avoiding
/// fiddly per-row position arithmetic.
#[tauri::command]
pub async fn set_playlist_tracks(
    pool: State<'_, SqlitePool>,
    playlist_id: i64,
    track_paths: Vec<String>,
) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM playlist_tracks WHERE playlist_id = ?")
        .bind(playlist_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    for (position, path) in track_paths.iter().enumerate() {
        let track_id: Option<i64> = sqlx::query_scalar("SELECT id FROM tracks WHERE path = ?")
            .bind(path)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        if let Some(track_id) = track_id {
            sqlx::query(
                "INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)",
            )
            .bind(playlist_id)
            .bind(track_id)
            .bind(position as i64)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
