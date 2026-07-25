import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import type { Track } from "../types";
import { Thumbnail } from "../components/Thumbnail";
import { formatTime, shuffleArray } from "../utils";

type SortField = "title" | "artist" | "album" | "duration";
const SORT_FIELDS: SortField[] = ["title", "artist", "album", "duration"];

interface TracksTabProps {
  tracks: Track[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

export function TracksTab({ tracks, currentTrackId, onPlayList }: TracksTabProps) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    );
  }, [tracks, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp: number;
      switch (sortField) {
        case "duration":
          cmp = a.durationSecs - b.durationSecs;
          break;
        case "artist":
          cmp = a.artist.localeCompare(b.artist);
          break;
        case "album":
          cmp = a.album.localeCompare(b.album);
          break;
        default:
          cmp = a.title.localeCompare(b.title);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortField, sortAsc]);

  function cycleSort(field: SortField) {
    if (field === sortField) {
      setSortAsc((asc) => !asc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search title, artist, album…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <button
          className="icon-button"
          onClick={() => onPlayList(shuffleArray(sorted), 0)}
          disabled={sorted.length === 0}
          aria-label="Shuffle play all"
          title="Shuffle play all"
        >
          <Shuffle size={16} />
        </button>
      </div>

      <div className="sort-row">
        {SORT_FIELDS.map((field) => (
          <button
            key={field}
            className={`sort-pill ${sortField === field ? "sort-pill-active" : ""}`}
            onClick={() => cycleSort(field)}
          >
            {field[0].toUpperCase() + field.slice(1)}
            {sortField === field ? (sortAsc ? " ▲" : " ▼") : ""}
          </button>
        ))}
      </div>

      <div className="track-list">
        {sorted.length === 0 ? (
          <p className="track-list-empty">{tracks.length === 0 ? "No tracks yet." : "No matches."}</p>
        ) : (
          sorted.map((track, index) => (
            <div
              className={`track-row ${track.id === currentTrackId ? "track-row-active" : ""}`}
              key={track.id}
              onClick={() => onPlayList(sorted, index)}
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
    </div>
  );
}
