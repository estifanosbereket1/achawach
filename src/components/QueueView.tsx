import { useMemo } from "react";
import { CaretDownIcon, CaretUpIcon, XIcon } from "@phosphor-icons/react";
import type { Track } from "../types";
import { Thumbnail } from "./Thumbnail";
import { formatTime } from "../utils";

interface QueueViewProps {
  tracks: Track[];
  queueTrackIds: string[];
  currentIndex: number;
  onJumpToIndex: (index: number) => void;
  onReorder: (trackIds: string[]) => void;
  onClose: () => void;
}

export function QueueView({
  tracks,
  queueTrackIds,
  currentIndex,
  onJumpToIndex,
  onReorder,
  onClose,
}: QueueViewProps) {
  const byId = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);

  function moveUp(index: number) {
    if (index <= currentIndex + 1) return;
    const next = [...queueTrackIds];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onReorder(next);
  }

  function moveDown(index: number) {
    if (index >= queueTrackIds.length - 1) return;
    const next = [...queueTrackIds];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    onReorder(next);
  }

  return (
    <div className="tab-panel">
      <div className="pn-section-header">
        <span className="pn-section-title">Up Next</span>
        <button className="icon-button" onClick={onClose} aria-label="Close queue">
          <XIcon size={16} />
        </button>
      </div>

      {queueTrackIds.length === 0 ? (
        <p className="track-list-empty">Nothing queued — play something from any library tab.</p>
      ) : (
        <div className="track-list">
          {queueTrackIds.map((id, index) => {
            const track = byId.get(id);
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;
            return (
              <div
                className={`track-row ${isCurrent ? "track-row-active" : ""}`}
                key={`${id}-${index}`}
                onClick={() => onJumpToIndex(index)}
              >
                <Thumbnail artworkPath={track?.artworkPath ?? null} size={36} alt={track?.album} />
                <div className="track-info">
                  <span className="track-title">{track?.title ?? "Unknown track"}</span>
                  <span className="track-meta">{track ? `${track.artist} — ${track.album}` : ""}</span>
                </div>
                {track && <span className="track-duration mono">{formatTime(track.durationSecs)}</span>}
                {isUpcoming && (
                  <div className="playlist-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-button"
                      onClick={() => moveUp(index)}
                      disabled={index === currentIndex + 1}
                      aria-label="Move up"
                    >
                      <CaretUpIcon size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => moveDown(index)}
                      disabled={index === queueTrackIds.length - 1}
                      aria-label="Move down"
                    >
                      <CaretDownIcon size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
