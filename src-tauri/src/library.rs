use lofty::picture::{MimeType, PictureType};
use lofty::prelude::*;
use serde::Serialize;
use sqlx::{Row, SqlitePool};
use std::collections::HashSet;
use std::hash::{Hash, Hasher};
use std::path::Path;
use tauri::{Manager, State};
use walkdir::WalkDir;

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "ogg", "m4a", "wav"];

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub id: String,
    pub path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub genre: String,
    pub duration_secs: i64,
    pub artwork_path: Option<String>,
}

struct ScannedTrack {
    path: String,
    title: String,
    artist: String,
    album: String,
    genre: String,
    duration_secs: i64,
    artwork_path: Option<String>,
}

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

fn hash_path(path: &Path) -> String {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

fn extract_artwork(tag: Option<&lofty::tag::Tag>, path: &Path, artwork_dir: &Path) -> Option<String> {
    let tag = tag?;
    let pictures = tag.pictures();
    let picture = pictures
        .iter()
        .find(|p| p.pic_type() == PictureType::CoverFront)
        .or_else(|| pictures.first())?;

    let ext = match picture.mime_type() {
        Some(MimeType::Png) => "png",
        Some(MimeType::Gif) => "gif",
        Some(MimeType::Bmp) => "bmp",
        _ => "jpg",
    };

    let file_name = format!("{}.{}", hash_path(path), ext);
    let dest = artwork_dir.join(&file_name);
    std::fs::write(&dest, picture.data()).ok()?;
    Some(dest.to_string_lossy().to_string())
}

fn read_track(path: &Path, artwork_dir: &Path) -> Option<ScannedTrack> {
    let tagged_file = lofty::read_from_path(path).ok()?;
    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());

    let title = tag
        .and_then(|t| t.title())
        .map(|c| c.to_string())
        .unwrap_or_else(|| {
            path.file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown Title".to_string())
        });
    let artist = tag
        .and_then(|t| t.artist())
        .map(|c| c.to_string())
        .unwrap_or_else(|| "Unknown Artist".to_string());
    let album = tag
        .and_then(|t| t.album())
        .map(|c| c.to_string())
        .unwrap_or_else(|| "Unknown Album".to_string());
    let genre = tag
        .and_then(|t| t.genre())
        .map(|c| c.to_string())
        .unwrap_or_else(|| "Unknown Genre".to_string());
    let duration_secs = tagged_file.properties().duration().as_secs() as i64;
    let artwork_path = extract_artwork(tag, path, artwork_dir);

    Some(ScannedTrack {
        path: path.to_string_lossy().to_string(),
        title,
        artist,
        album,
        genre,
        duration_secs,
        artwork_path,
    })
}

async fn upsert_track(pool: &SqlitePool, scanned: &ScannedTrack) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO tracks (path, title, artist, album, genre, duration_secs, artwork_path, date_added)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(path) DO UPDATE SET
            title = excluded.title,
            artist = excluded.artist,
            album = excluded.album,
            genre = excluded.genre,
            duration_secs = excluded.duration_secs,
            artwork_path = excluded.artwork_path",
    )
    .bind(&scanned.path)
    .bind(&scanned.title)
    .bind(&scanned.artist)
    .bind(&scanned.album)
    .bind(&scanned.genre)
    .bind(scanned.duration_secs)
    .bind(&scanned.artwork_path)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn row_to_track(row: &sqlx::sqlite::SqliteRow) -> Result<Track, sqlx::Error> {
    let path: String = row.try_get("path")?;
    Ok(Track {
        id: path.clone(),
        path,
        title: row.try_get("title")?,
        artist: row.try_get("artist")?,
        album: row.try_get("album")?,
        genre: row.try_get("genre")?,
        duration_secs: row.try_get("duration_secs")?,
        artwork_path: row.try_get("artwork_path")?,
    })
}

pub async fn fetch_library(pool: &SqlitePool) -> Result<Vec<Track>, String> {
    let rows = sqlx::query(
        "SELECT path, title, artist, album, genre, duration_secs, artwork_path
         FROM tracks ORDER BY title COLLATE NOCASE",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    rows.iter()
        .map(row_to_track)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_library(pool: State<'_, SqlitePool>) -> Result<Vec<Track>, String> {
    fetch_library(pool.inner()).await
}

#[tauri::command]
pub async fn scan_folders(
    app: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
    roots: Vec<String>,
) -> Result<Vec<Track>, String> {
    let artwork_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("artwork");
    std::fs::create_dir_all(&artwork_dir).map_err(|e| e.to_string())?;

    let mut found_paths = HashSet::new();

    for root in &roots {
        for entry in WalkDir::new(root).into_iter().filter_map(|entry| entry.ok()) {
            let path = entry.path();
            if !path.is_file() || !is_audio_file(path) {
                continue;
            }
            let Some(scanned) = read_track(path, &artwork_dir) else {
                continue;
            };
            found_paths.insert(scanned.path.clone());
            upsert_track(pool.inner(), &scanned).await?;
        }
    }

    let existing_paths: Vec<String> = sqlx::query_scalar("SELECT path FROM tracks")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    for path in existing_paths {
        if !found_paths.contains(&path) {
            sqlx::query("DELETE FROM tracks WHERE path = ?")
                .bind(&path)
                .execute(pool.inner())
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    fetch_library(pool.inner()).await
}
