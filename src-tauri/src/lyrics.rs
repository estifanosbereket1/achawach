use lofty::prelude::*;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LyricLine {
    pub time_secs: f64,
    pub text: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricsResult {
    /// Time-stamped lines parsed from a sidecar `.lrc` file, if one exists
    /// next to the track. Preferred over `unsynced` when both are present.
    pub synced: Option<Vec<LyricLine>>,
    /// Plain lyrics text read from the embedded tag (ID3v2 USLT, Vorbis
    /// UNSYNCEDLYRICS/LYRICS). `lofty` doesn't expose synced ID3v2 SYLT
    /// frames through the generic tag API, so embedded lyrics are always
    /// treated as unsynced here.
    pub unsynced: Option<String>,
}

fn parse_timestamp(tag: &str) -> Option<f64> {
    let (minutes_str, seconds_str) = tag.split_once(':')?;
    let minutes: f64 = minutes_str.trim().parse().ok()?;
    let seconds: f64 = seconds_str.trim().parse().ok()?;
    Some(minutes * 60.0 + seconds)
}

fn parse_lrc(content: &str) -> Vec<LyricLine> {
    let mut lines = Vec::new();

    for raw_line in content.lines() {
        let mut rest = raw_line;
        let mut timestamps = Vec::new();

        while let Some(stripped) = rest.strip_prefix('[') {
            let Some(end) = stripped.find(']') else {
                break;
            };
            let tag = &stripped[..end];
            if let Some(secs) = parse_timestamp(tag) {
                timestamps.push(secs);
            }
            rest = &stripped[end + 1..];
        }

        if timestamps.is_empty() {
            continue;
        }
        let text = rest.trim().to_string();
        for time_secs in timestamps {
            lines.push(LyricLine {
                time_secs,
                text: text.clone(),
            });
        }
    }

    lines.sort_by(|a, b| a.time_secs.partial_cmp(&b.time_secs).unwrap());
    lines
}

#[tauri::command]
pub fn get_lyrics(path: String) -> Result<LyricsResult, String> {
    let audio_path = Path::new(&path);

    let lrc_path = audio_path.with_extension("lrc");
    let synced = std::fs::read_to_string(&lrc_path)
        .ok()
        .map(|content| parse_lrc(&content))
        .filter(|lines| !lines.is_empty());

    let unsynced = if synced.is_none() {
        lofty::read_from_path(audio_path).ok().and_then(|tagged_file| {
            let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag())?;
            tag.get_string(ItemKey::UnsyncLyrics)
                .or_else(|| tag.get_string(ItemKey::Lyrics))
                .map(|s| s.to_string())
        })
    } else {
        None
    };

    Ok(LyricsResult { synced, unsynced })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_basic_lrc_lines_in_time_order() {
        let content = "[00:12.50]Second line\n[00:00.00]First line\n";
        let lines = parse_lrc(content);
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].text, "First line");
        assert_eq!(lines[0].time_secs, 0.0);
        assert_eq!(lines[1].text, "Second line");
        assert_eq!(lines[1].time_secs, 12.5);
    }

    #[test]
    fn expands_multiple_timestamps_on_one_line() {
        let content = "[00:10.00][01:05.00]Repeated chorus";
        let lines = parse_lrc(content);
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].time_secs, 10.0);
        assert_eq!(lines[1].time_secs, 65.0);
        assert_eq!(lines[0].text, "Repeated chorus");
    }

    #[test]
    fn ignores_metadata_lines_without_a_valid_timestamp() {
        let content = "[ar:Some Artist]\n[00:05.00]Actual lyric\n";
        let lines = parse_lrc(content);
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0].text, "Actual lyric");
    }
}
