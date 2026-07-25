CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    genre TEXT NOT NULL,
    duration_secs INTEGER NOT NULL,
    artwork_path TEXT,
    date_added TEXT NOT NULL,
    play_count INTEGER NOT NULL DEFAULT 0,
    last_played TEXT
);

CREATE TABLE play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TEXT NOT NULL
);

CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE playlist_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL
);

CREATE INDEX idx_play_history_track_id ON play_history(track_id);
CREATE INDEX idx_play_history_played_at ON play_history(played_at);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
