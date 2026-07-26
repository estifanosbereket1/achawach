use crate::library;
use crate::player::{self, PlayerHandle, PlayerSnapshot, RepeatMode};
use mpris_server::zbus::{self, fdo};
use mpris_server::{LoopStatus, Metadata, PlaybackRate, PlaybackStatus, PlayerInterface, Property, RootInterface, Server, Time, TrackId, Volume};
use sqlx::SqlitePool;
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub struct MprisPlayer {
    app: AppHandle,
}

pub struct MprisHandle(pub Server<MprisPlayer>);

fn fdo_err(e: String) -> fdo::Error {
    fdo::Error::Failed(e)
}

fn track_id_for_index(index: usize) -> TrackId {
    TrackId::try_from(format!("/org/mpris/MediaPlayer2/Track/{index}")).unwrap_or(TrackId::NO_TRACK)
}

fn playback_status_from(snapshot: &PlayerSnapshot) -> PlaybackStatus {
    if snapshot.current_track_id.is_none() {
        PlaybackStatus::Stopped
    } else if snapshot.is_paused {
        PlaybackStatus::Paused
    } else {
        PlaybackStatus::Playing
    }
}

fn loop_status_from(mode: RepeatMode) -> LoopStatus {
    match mode {
        RepeatMode::Off => LoopStatus::None,
        RepeatMode::All => LoopStatus::Playlist,
        RepeatMode::One => LoopStatus::Track,
    }
}

fn repeat_mode_from(status: LoopStatus) -> RepeatMode {
    match status {
        LoopStatus::None => RepeatMode::Off,
        LoopStatus::Playlist => RepeatMode::All,
        LoopStatus::Track => RepeatMode::One,
    }
}

async fn build_metadata(app: &AppHandle, snapshot: &PlayerSnapshot) -> Metadata {
    let mut metadata = Metadata::new();

    let Some(path) = &snapshot.current_track_id else {
        metadata.set_trackid(Some(TrackId::NO_TRACK));
        return metadata;
    };

    metadata.set_trackid(Some(track_id_for_index(snapshot.current_index)));

    let Some(pool) = app.try_state::<SqlitePool>() else {
        return metadata;
    };

    // sqlx's query future is `Send` but not `Sync`, which would make this
    // whole `async fn`'s generated future `!Sync` too -- and the
    // `PlayerInterface` trait requires `Send + Sync` futures. Spawning
    // isolates that `!Sync` future inside its own task; we only ever await
    // the plain, `Sync`-safe `JoinHandle` here.
    let pool = pool.inner().clone();
    let path = path.clone();
    let fetched = tauri::async_runtime::spawn(async move {
        library::fetch_track_by_path(&pool, &path).await
    })
    .await
    .ok()
    .and_then(|r| r.ok())
    .flatten();

    if let Some(track) = fetched {
        metadata.set_title(Some(track.title));
        metadata.set_artist(Some(vec![track.artist]));
        metadata.set_album(Some(track.album));
        metadata.set_length(Some(Time::from_secs(track.duration_secs)));
        if let Some(artwork_path) = &track.artwork_path {
            metadata.set_art_url(Some(format!("file://{artwork_path}")));
        }
    }

    metadata
}

impl RootInterface for MprisPlayer {
    async fn raise(&self) -> fdo::Result<()> {
        if let Some(window) = self.app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
        Ok(())
    }

    async fn quit(&self) -> fdo::Result<()> {
        Ok(())
    }

    async fn can_quit(&self) -> fdo::Result<bool> {
        Ok(false)
    }

    async fn fullscreen(&self) -> fdo::Result<bool> {
        Ok(false)
    }

    async fn set_fullscreen(&self, _fullscreen: bool) -> zbus::Result<()> {
        Ok(())
    }

    async fn can_set_fullscreen(&self) -> fdo::Result<bool> {
        Ok(false)
    }

    async fn can_raise(&self) -> fdo::Result<bool> {
        Ok(true)
    }

    async fn has_track_list(&self) -> fdo::Result<bool> {
        Ok(false)
    }

    async fn identity(&self) -> fdo::Result<String> {
        Ok("achawatch".to_string())
    }

    async fn desktop_entry(&self) -> fdo::Result<String> {
        Ok("achawatch".to_string())
    }

    async fn supported_uri_schemes(&self) -> fdo::Result<Vec<String>> {
        Ok(vec![])
    }

    async fn supported_mime_types(&self) -> fdo::Result<Vec<String>> {
        Ok(vec![])
    }
}

impl PlayerInterface for MprisPlayer {
    async fn next(&self) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::next_track(handle, false).map_err(fdo_err)?;
        Ok(())
    }

    async fn previous(&self) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::prev_track(handle).map_err(fdo_err)?;
        Ok(())
    }

    async fn pause(&self) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::pause(handle).map_err(fdo_err)?;
        Ok(())
    }

    async fn play_pause(&self) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        let handle = self.app.state::<PlayerHandle>();
        if snapshot.is_paused {
            player::play(handle).map_err(fdo_err)?;
        } else {
            player::pause(handle).map_err(fdo_err)?;
        }
        Ok(())
    }

    async fn stop(&self) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::pause(handle).map_err(fdo_err)?;
        let handle = self.app.state::<PlayerHandle>();
        player::seek(handle, 0.0).map_err(fdo_err)?;
        Ok(())
    }

    async fn play(&self) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::play(handle).map_err(fdo_err)?;
        Ok(())
    }

    async fn seek(&self, offset: Time) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        let new_position = (snapshot.position_secs + offset.as_micros() as f64 / 1_000_000.0).max(0.0);
        let handle = self.app.state::<PlayerHandle>();
        player::seek(handle, new_position).map_err(fdo_err)?;
        Ok(())
    }

    async fn set_position(&self, track_id: TrackId, position: Time) -> fdo::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        if track_id != track_id_for_index(snapshot.current_index) {
            return Ok(());
        }
        let handle = self.app.state::<PlayerHandle>();
        let position_secs = (position.as_micros() as f64 / 1_000_000.0).max(0.0);
        player::seek(handle, position_secs).map_err(fdo_err)?;
        Ok(())
    }

    async fn open_uri(&self, _uri: String) -> fdo::Result<()> {
        Err(fdo::Error::NotSupported("Opening arbitrary URIs is not supported".into()))
    }

    async fn playback_status(&self) -> fdo::Result<PlaybackStatus> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(playback_status_from(&snapshot))
    }

    async fn loop_status(&self) -> fdo::Result<LoopStatus> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(loop_status_from(snapshot.repeat))
    }

    async fn set_loop_status(&self, loop_status: LoopStatus) -> zbus::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::set_repeat(handle, repeat_mode_from(loop_status)).map_err(|e| zbus::Error::Failure(e))?;
        Ok(())
    }

    async fn rate(&self) -> fdo::Result<PlaybackRate> {
        Ok(1.0)
    }

    async fn set_rate(&self, _rate: PlaybackRate) -> zbus::Result<()> {
        Ok(())
    }

    async fn shuffle(&self) -> fdo::Result<bool> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(snapshot.shuffle)
    }

    async fn set_shuffle(&self, shuffle: bool) -> zbus::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::set_shuffle(handle, shuffle).map_err(|e| zbus::Error::Failure(e))?;
        Ok(())
    }

    async fn metadata(&self) -> fdo::Result<Metadata> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(build_metadata(&self.app, &snapshot).await)
    }

    async fn volume(&self) -> fdo::Result<Volume> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(snapshot.volume as f64)
    }

    async fn set_volume(&self, volume: Volume) -> zbus::Result<()> {
        let handle = self.app.state::<PlayerHandle>();
        player::set_volume(handle, volume as f32).map_err(|e| zbus::Error::Failure(e))?;
        Ok(())
    }

    async fn position(&self) -> fdo::Result<Time> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(Time::from_micros((snapshot.position_secs * 1_000_000.0) as i64))
    }

    async fn minimum_rate(&self) -> fdo::Result<PlaybackRate> {
        Ok(1.0)
    }

    async fn maximum_rate(&self) -> fdo::Result<PlaybackRate> {
        Ok(1.0)
    }

    async fn can_go_next(&self) -> fdo::Result<bool> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(!snapshot.queue.is_empty())
    }

    async fn can_go_previous(&self) -> fdo::Result<bool> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(!snapshot.queue.is_empty())
    }

    async fn can_play(&self) -> fdo::Result<bool> {
        Ok(true)
    }

    async fn can_pause(&self) -> fdo::Result<bool> {
        Ok(true)
    }

    async fn can_seek(&self) -> fdo::Result<bool> {
        let handle = self.app.state::<PlayerHandle>();
        let snapshot = player::get_position(handle).map_err(fdo_err)?;
        Ok(snapshot.current_track_id.is_some())
    }

    async fn can_control(&self) -> fdo::Result<bool> {
        Ok(true)
    }
}

/// Registers the `org.mpris.MediaPlayer2.achawatch` D-Bus service so desktop
/// media-key widgets (GNOME Shell, KDE Plasma, etc.) can control playback.
/// Returns `None` (logged, non-fatal) if no session D-Bus is available —
/// media key support just won't be there, the rest of the app is unaffected.
pub async fn init(app: &AppHandle) -> Option<MprisHandle> {
    let player = MprisPlayer { app: app.clone() };
    match Server::new("achawatch", player).await {
        Ok(server) => Some(MprisHandle(server)),
        Err(e) => {
            eprintln!("[mpris] failed to register D-Bus service: {e}");
            None
        }
    }
}

/// Polls playback state at the same ~500ms cadence the frontend uses and
/// emits MPRIS `PropertiesChanged` signals on change, so external media
/// widgets (GNOME Shell's OSD, lock screen controls) stay in sync whether
/// the change originated from the app UI or from a media key.
pub async fn run_property_poller(app: AppHandle) {
    let mut last: Option<(Option<String>, bool, bool, RepeatMode, f32, bool)> = None;

    loop {
        tokio::time::sleep(Duration::from_millis(500)).await;

        let Some(mpris_handle) = app.try_state::<MprisHandle>() else {
            continue;
        };
        let Some(player_handle) = app.try_state::<PlayerHandle>() else {
            continue;
        };
        let Ok(snapshot) = player::get_position(player_handle) else {
            continue;
        };

        let has_queue = !snapshot.queue.is_empty();
        let key = (
            snapshot.current_track_id.clone(),
            snapshot.is_paused,
            snapshot.shuffle,
            snapshot.repeat,
            snapshot.volume,
            has_queue,
        );
        if last.as_ref() == Some(&key) {
            continue;
        }

        let track_changed = last.as_ref().map(|l| &l.0) != Some(&snapshot.current_track_id);
        let mut properties = vec![
            Property::PlaybackStatus(playback_status_from(&snapshot)),
            Property::Shuffle(snapshot.shuffle),
            Property::LoopStatus(loop_status_from(snapshot.repeat)),
            Property::Volume(snapshot.volume as f64),
            Property::CanGoNext(has_queue),
            Property::CanGoPrevious(has_queue),
            Property::CanSeek(snapshot.current_track_id.is_some()),
        ];
        if track_changed {
            properties.push(Property::Metadata(build_metadata(&app, &snapshot).await));
        }

        let _ = mpris_handle.0.properties_changed(properties).await;
        last = Some(key);
    }
}
