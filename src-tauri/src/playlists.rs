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

async fn fetch_playlist_tracks(pool: &SqlitePool, playlist_id: i64) -> Result<Vec<Track>, String> {
    let paths: Vec<String> = sqlx::query_scalar(
        "SELECT t.path FROM playlist_tracks pt
         JOIN tracks t ON t.id = pt.track_id
         WHERE pt.playlist_id = ?
         ORDER BY pt.position",
    )
    .bind(playlist_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let library = fetch_library(pool).await?;
    let by_path: std::collections::HashMap<&str, &Track> =
        library.iter().map(|t| (t.path.as_str(), t)).collect();

    Ok(paths
        .iter()
        .filter_map(|p| by_path.get(p.as_str()).map(|t| (*t).clone()))
        .collect())
}

#[tauri::command]
pub async fn get_playlist_tracks(
    pool: State<'_, SqlitePool>,
    playlist_id: i64,
) -> Result<Vec<Track>, String> {
    fetch_playlist_tracks(pool.inner(), playlist_id).await
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

#[tauri::command]
pub async fn export_playlist_m3u(
    pool: State<'_, SqlitePool>,
    playlist_id: i64,
    file_path: String,
) -> Result<(), String> {
    let tracks = fetch_playlist_tracks(pool.inner(), playlist_id).await?;

    let mut content = String::from("#EXTM3U\n");
    for track in &tracks {
        content.push_str(&format!(
            "#EXTINF:{},{} - {}\n",
            track.duration_secs, track.artist, track.title
        ));
        content.push_str(&track.path);
        content.push('\n');
    }

    std::fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub playlist_id: i64,
    pub matched: i64,
    pub total: i64,
}

/// Parses an M3U/M3U8 file (skipping `#` comment/EXTINF lines), resolving
/// relative entries against the playlist file's own directory, and matches
/// each resulting path against the library by exact path — entries that
/// don't match an existing track are silently skipped, reflected in the
/// `matched` vs `total` counts returned to the frontend.
#[tauri::command]
pub async fn import_playlist_m3u(
    pool: State<'_, SqlitePool>,
    file_path: String,
    playlist_name: String,
) -> Result<ImportResult, String> {
    let content = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let base_dir = std::path::Path::new(&file_path).parent();

    let mut candidate_paths = Vec::new();
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let path = std::path::Path::new(line);
        let resolved = if path.is_absolute() {
            path.to_path_buf()
        } else {
            base_dir.map(|base| base.join(path)).unwrap_or_else(|| path.to_path_buf())
        };
        candidate_paths.push(resolved.to_string_lossy().to_string());
    }
    let total = candidate_paths.len() as i64;

    let mut matched_ids = Vec::new();
    for path in &candidate_paths {
        let track_id: Option<i64> = sqlx::query_scalar("SELECT id FROM tracks WHERE path = ?")
            .bind(path)
            .fetch_optional(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
        if let Some(id) = track_id {
            matched_ids.push(id);
        }
    }

    let result = sqlx::query("INSERT INTO playlists (name, created_at) VALUES (?, datetime('now'))")
        .bind(&playlist_name)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let playlist_id = result.last_insert_rowid();

    for (position, track_id) in matched_ids.iter().enumerate() {
        sqlx::query("INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)")
            .bind(playlist_id)
            .bind(track_id)
            .bind(position as i64)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(ImportResult {
        playlist_id,
        matched: matched_ids.len() as i64,
        total,
    })
}
