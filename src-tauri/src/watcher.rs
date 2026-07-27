use notify::RecursiveMode;
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

const DEBOUNCE_SECS: u64 = 2;

type AppDebouncer = Debouncer<notify::RecommendedWatcher, RecommendedCache>;

pub struct WatcherHandle(Mutex<Option<AppDebouncer>>);

impl WatcherHandle {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

/// Replaces whatever folders are currently being watched with `roots`.
/// Recreating the debouncer on every call (rather than diffing paths) is
/// simple and correct since this only runs on infrequent user actions
/// (adding/removing a music folder), not a hot path.
#[tauri::command]
pub fn set_watched_roots(
    app: AppHandle,
    handle: State<WatcherHandle>,
    roots: Vec<String>,
) -> Result<(), String> {
    let mut guard = handle.0.lock().map_err(|e| e.to_string())?;

    // Drop the previous debouncer first so its watcher thread stops before
    // we start a new one.
    *guard = None;

    let app_for_events = app.clone();
    // `Access` events (file opened/read/closed, no content change) are excluded here:
    // the Linux backend watches `OPEN` by default, so simply *playing* a track inside a
    // watched folder was generating a steady stream of these and triggering a full
    // rescan every couple of seconds, purely from the player reading the file it's
    // already streaming — not an actual library change.
    let mut debouncer = new_debouncer(Duration::from_secs(DEBOUNCE_SECS), None, move |result: DebounceEventResult| {
        if let Ok(events) = result {
            let has_relevant_change = events.iter().any(|e| !e.kind.is_access());
            if has_relevant_change {
                let _ = app_for_events.emit("library-changed", ());
            }
        }
    })
    .map_err(|e| e.to_string())?;

    for root in &roots {
        // Best-effort: a root that no longer exists on disk shouldn't stop
        // the others from being watched.
        let _ = debouncer.watch(Path::new(root), RecursiveMode::Recursive);
    }

    *guard = Some(debouncer);
    Ok(())
}
