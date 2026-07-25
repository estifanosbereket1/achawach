use lofty::prelude::*;
use serde::Serialize;
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
    pub duration_secs: u64,
}

fn is_audio_file(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

fn read_track(path: &std::path::Path) -> Option<Track> {
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
    let duration_secs = tagged_file.properties().duration().as_secs();

    let path_string = path.to_string_lossy().to_string();

    Some(Track {
        id: path_string.clone(),
        path: path_string,
        title,
        artist,
        album,
        duration_secs,
    })
}

#[tauri::command]
pub fn scan_folders(roots: Vec<String>) -> Result<Vec<Track>, String> {
    let mut tracks = Vec::new();

    for root in roots {
        for entry in WalkDir::new(&root)
            .into_iter()
            .filter_map(|entry| entry.ok())
        {
            let path = entry.path();
            if !path.is_file() || !is_audio_file(path) {
                continue;
            }
            if let Some(track) = read_track(path) {
                tracks.push(track);
            }
        }
    }

    Ok(tracks)
}
