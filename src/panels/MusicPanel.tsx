import { useMemo, useState } from "react";
import type { PlayerSnapshot, Track } from "../types";
import { RootChip } from "../components/RootChip";
import { formatTime } from "../utils";

interface MusicPanelProps {
  roots: string[];
  tracks: Track[];
  isScanning: boolean;
  onAddRoots: () => void;
  onRemoveRoot: (root: string) => void;
  onRescan: () => void;
  snapshot: PlayerSnapshot | null;
  onTrackClick: (list: Track[], index: number) => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (positionSecs: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
}

export function MusicPanel({
  roots,
  tracks,
  isScanning,
  onAddRoots,
  onRemoveRoot,
  onRescan,
  snapshot,
  onTrackClick,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
}: MusicPanelProps) {
  const [query, setQuery] = useState("");

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    );
  }, [tracks, query]);

  const currentTrack = tracks.find((t) => t.id === snapshot?.currentTrackId) ?? null;
  const position = snapshot?.positionSecs ?? 0;
  const duration = currentTrack?.durationSecs ?? 0;

  return (
    <div className="music-panel">
      <div className="root-row">
        {roots.map((root) => (
          <RootChip key={root} path={root} onRemove={() => onRemoveRoot(root)} />
        ))}
        <button className="pill-button" onClick={onAddRoots}>
          + Add Folder
        </button>
        <button className="pill-button" onClick={onRescan} disabled={isScanning || roots.length === 0}>
          {isScanning ? "Scanning…" : "Rescan"}
        </button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search title, artist, album…"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />

      <div className="track-list">
        {filteredTracks.length === 0 ? (
          <p className="track-list-empty">
            {tracks.length === 0
              ? roots.length === 0
                ? "Add a folder to scan for music."
                : "No tracks found."
              : "No matches."}
          </p>
        ) : (
          filteredTracks.map((track, index) => (
            <div
              className={`track-row ${track.id === snapshot?.currentTrackId ? "track-row-active" : ""}`}
              key={track.id}
              onClick={() => onTrackClick(filteredTracks, index)}
            >
              <div className="track-info">
                <span className="track-title">{track.title}</span>
                <span className="track-meta">
                  {track.artist} — {track.album}
                </span>
              </div>
              <span className="track-duration mono">{formatTime(track.durationSecs)}</span>
            </div>
          ))
        )}
      </div>

      <div className="transport-bar">
        <div className="transport-now-playing">
          <span className="track-title">{currentTrack?.title ?? "Nothing playing"}</span>
          <span className="track-meta">{currentTrack?.artist ?? ""}</span>
        </div>

        <div className="transport-progress">
          <span className="mono transport-time">{formatTime(position)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(position, duration || 1)}
            disabled={!currentTrack}
            onChange={(e) => onSeek(Number(e.currentTarget.value))}
          />
          <span className="mono transport-time">{formatTime(duration)}</span>
        </div>

        <div className="transport-controls">
          <button
            className={`pill-button ${snapshot?.shuffle ? "pill-button-active" : ""}`}
            onClick={onToggleShuffle}
          >
            Shuffle
          </button>
          <button className="pill-button" onClick={onPrev} disabled={!currentTrack}>
            Prev
          </button>
          <button className="pill-button" onClick={onTogglePlayPause} disabled={!currentTrack}>
            {snapshot && !snapshot.isPaused ? "Pause" : "Play"}
          </button>
          <button className="pill-button" onClick={onNext} disabled={!currentTrack}>
            Next
          </button>
          <button
            className={`pill-button ${snapshot && snapshot.repeat !== "off" ? "pill-button-active" : ""}`}
            onClick={onCycleRepeat}
          >
            Repeat: {snapshot?.repeat ?? "off"}
          </button>
          <div className="transport-volume">
            <span>Vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={snapshot?.volume ?? 1}
              onChange={(e) => onVolumeChange(Number(e.currentTarget.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
