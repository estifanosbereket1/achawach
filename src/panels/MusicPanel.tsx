import { useMemo, useState } from "react";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import type { PlayerSnapshot, Track } from "../types";
import { RootChip } from "../components/RootChip";
import { Thumbnail } from "../components/Thumbnail";
import { formatTime } from "../utils";

const ICON_SIZE = 16;

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
              <Thumbnail artworkPath={track.artworkPath} size={36} alt={track.album} />
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
          <Thumbnail artworkPath={currentTrack?.artworkPath ?? null} size={44} alt={currentTrack?.album} />
          <div className="transport-now-playing-info">
            <span className="track-title">{currentTrack?.title ?? "Nothing playing"}</span>
            <span className="track-meta">{currentTrack?.artist ?? ""}</span>
          </div>
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
            className={`icon-button ${snapshot?.shuffle ? "icon-button-active" : ""}`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >
            <Shuffle size={ICON_SIZE} />
          </button>
          <button className="icon-button" onClick={onPrev} disabled={!currentTrack} aria-label="Previous">
            <SkipBack size={ICON_SIZE} />
          </button>
          <button
            className="icon-button icon-button-play"
            onClick={onTogglePlayPause}
            disabled={!currentTrack}
            aria-label={snapshot && !snapshot.isPaused ? "Pause" : "Play"}
          >
            {snapshot && !snapshot.isPaused ? <Pause size={ICON_SIZE} /> : <Play size={ICON_SIZE} />}
          </button>
          <button className="icon-button" onClick={onNext} disabled={!currentTrack} aria-label="Next">
            <SkipForward size={ICON_SIZE} />
          </button>
          <button
            className={`icon-button ${snapshot && snapshot.repeat !== "off" ? "icon-button-active" : ""}`}
            onClick={onCycleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${snapshot?.repeat ?? "off"}`}
          >
            {snapshot?.repeat === "one" ? <Repeat1 size={ICON_SIZE} /> : <Repeat size={ICON_SIZE} />}
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
