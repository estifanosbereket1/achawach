use rodio::{Decoder, DeviceSinkBuilder, Player as RodioPlayer};
use serde::Serialize;
use std::fs::File;
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;

pub struct PlaybackState {
    _device: rodio::stream::MixerDeviceSink,
    player: RodioPlayer,
    queue: Vec<String>,
    current_index: usize,
    volume: f32,
}

pub struct PlayerHandle(Mutex<PlaybackState>);

impl PlayerHandle {
    pub fn new() -> Result<Self, String> {
        let device = DeviceSinkBuilder::open_default_sink().map_err(|e| e.to_string())?;
        let player = RodioPlayer::connect_new(device.mixer());
        player.set_volume(1.0);

        Ok(Self(Mutex::new(PlaybackState {
            _device: device,
            player,
            queue: Vec::new(),
            current_index: 0,
            volume: 1.0,
        })))
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerSnapshot {
    pub current_track_id: Option<String>,
    pub is_paused: bool,
    pub position_secs: f64,
    pub queue: Vec<String>,
    pub current_index: usize,
    pub volume: f32,
}

fn snapshot(state: &PlaybackState) -> PlayerSnapshot {
    PlayerSnapshot {
        current_track_id: state.queue.get(state.current_index).cloned(),
        is_paused: state.player.is_paused(),
        position_secs: state.player.get_pos().as_secs_f64(),
        queue: state.queue.clone(),
        current_index: state.current_index,
        volume: state.volume,
    }
}

fn load_track(state: &mut PlaybackState, index: usize) -> Result<(), String> {
    let path = state
        .queue
        .get(index)
        .ok_or_else(|| "queue index out of range".to_string())?
        .clone();
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let decoder = Decoder::try_from(file).map_err(|e| e.to_string())?;

    state.player.clear();
    state.player.append(decoder);
    state.player.play();
    state.current_index = index;
    Ok(())
}

#[tauri::command]
pub fn set_queue(
    handle: State<PlayerHandle>,
    track_ids: Vec<String>,
    start_index: usize,
) -> Result<PlayerSnapshot, String> {
    let mut state = handle.0.lock().map_err(|e| e.to_string())?;
    state.queue = track_ids;
    load_track(&mut state, start_index)?;
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn play(handle: State<PlayerHandle>) -> Result<PlayerSnapshot, String> {
    let mut state = handle.0.lock().map_err(|e| e.to_string())?;
    if state.player.empty() && !state.queue.is_empty() {
        let index = state.current_index;
        load_track(&mut state, index)?;
    } else {
        state.player.play();
    }
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn pause(handle: State<PlayerHandle>) -> Result<PlayerSnapshot, String> {
    let state = handle.0.lock().map_err(|e| e.to_string())?;
    state.player.pause();
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn next_track(handle: State<PlayerHandle>) -> Result<PlayerSnapshot, String> {
    let mut state = handle.0.lock().map_err(|e| e.to_string())?;
    if state.queue.is_empty() {
        return Ok(snapshot(&state));
    }
    let next = (state.current_index + 1).min(state.queue.len() - 1);
    load_track(&mut state, next)?;
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn prev_track(handle: State<PlayerHandle>) -> Result<PlayerSnapshot, String> {
    let mut state = handle.0.lock().map_err(|e| e.to_string())?;
    if state.queue.is_empty() {
        return Ok(snapshot(&state));
    }
    let prev = state.current_index.saturating_sub(1);
    load_track(&mut state, prev)?;
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn seek(handle: State<PlayerHandle>, position_secs: f64) -> Result<PlayerSnapshot, String> {
    let state = handle.0.lock().map_err(|e| e.to_string())?;
    state
        .player
        .try_seek(Duration::from_secs_f64(position_secs.max(0.0)))
        .map_err(|e| e.to_string())?;
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn set_volume(handle: State<PlayerHandle>, volume: f32) -> Result<PlayerSnapshot, String> {
    let mut state = handle.0.lock().map_err(|e| e.to_string())?;
    let clamped = volume.clamp(0.0, 1.0);
    state.player.set_volume(clamped);
    state.volume = clamped;
    Ok(snapshot(&state))
}

#[tauri::command]
pub fn get_position(handle: State<PlayerHandle>) -> Result<PlayerSnapshot, String> {
    let state = handle.0.lock().map_err(|e| e.to_string())?;
    Ok(snapshot(&state))
}
