import type { Track } from "../types";
import { RootChip } from "../components/RootChip";
import { formatTime } from "../utils";

interface MusicPanelProps {
  roots: string[];
  tracks: Track[];
  isScanning: boolean;
  onAddRoots: () => void;
  onRemoveRoot: (root: string) => void;
  onRescan: () => void;
}

export function MusicPanel({
  roots,
  tracks,
  isScanning,
  onAddRoots,
  onRemoveRoot,
  onRescan,
}: MusicPanelProps) {
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

      <div className="track-list">
        {tracks.length === 0 ? (
          <p className="track-list-empty">
            {roots.length === 0 ? "Add a folder to scan for music." : "No tracks found."}
          </p>
        ) : (
          tracks.map((track) => (
            <div className="track-row" key={track.id}>
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
    </div>
  );
}
