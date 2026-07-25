import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import type { LyricsData } from "../hooks/useLyrics";

interface LyricsViewProps {
  title: string;
  lyrics: LyricsData | null;
  loading: boolean;
  positionSecs: number;
  onClose: () => void;
}

export function LyricsView({ title, lyrics, loading, positionSecs, onClose }: LyricsViewProps) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = useMemo(() => {
    if (!lyrics?.synced) return -1;
    let index = -1;
    for (const line of lyrics.synced) {
      if (line.timeSecs <= positionSecs) index++;
      else break;
    }
    return index;
  }, [lyrics, positionSecs]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  return (
    <div className="tab-panel">
      <div className="pn-section-header">
        <span className="pn-section-title">{title} — Lyrics</span>
        <button className="icon-button" onClick={onClose} aria-label="Close lyrics">
          <X size={16} />
        </button>
      </div>

      <div className="lyrics-body">
        {loading ? (
          <p className="track-list-empty">Loading lyrics…</p>
        ) : lyrics?.synced ? (
          lyrics.synced.map((line, index) => (
            <div
              key={index}
              ref={index === activeIndex ? activeLineRef : undefined}
              className={`lyrics-line ${index === activeIndex ? "lyrics-line-active" : ""}`}
            >
              {line.text}
            </div>
          ))
        ) : lyrics?.unsynced ? (
          <p className="lyrics-plain">{lyrics.unsynced}</p>
        ) : (
          <p className="track-list-empty">No lyrics found for this track.</p>
        )}
      </div>
    </div>
  );
}
