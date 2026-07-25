import { ArrowLeft, Music, Play, Shuffle } from "lucide-react";
import type { PlaylistActions, Track } from "../types";
import { Thumbnail } from "./Thumbnail";
import { TrackRows } from "./TrackRows";
import { shuffleArray } from "../utils";

type IconComponent = typeof Music;

interface TrackListDetailProps extends PlaylistActions {
  title: string;
  subtitle?: string;
  artworkPath: string | null;
  fallbackIcon?: IconComponent;
  tracks: Track[];
  currentTrackId: string | null;
  onBack: () => void;
  onPlayList: (list: Track[], index: number) => void;
}

export function TrackListDetail({
  title,
  subtitle,
  artworkPath,
  fallbackIcon,
  tracks,
  currentTrackId,
  onBack,
  onPlayList,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
}: TrackListDetailProps) {
  return (
    <div className="detail-view">
      <button className="icon-button" onClick={onBack} aria-label="Back">
        <ArrowLeft size={16} />
      </button>

      <div className="detail-header">
        <Thumbnail artworkPath={artworkPath} size={72} alt={title} fallbackIcon={fallbackIcon} />
        <div className="detail-header-info">
          <span className="detail-title">{title}</span>
          {subtitle && <span className="track-meta">{subtitle}</span>}
          <span className="track-meta">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="detail-header-actions">
          <button
            className="icon-button icon-button-play"
            onClick={() => onPlayList(tracks, 0)}
            disabled={tracks.length === 0}
            aria-label="Play"
            title="Play"
          >
            <Play size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => onPlayList(shuffleArray(tracks), 0)}
            disabled={tracks.length === 0}
            aria-label="Shuffle play"
            title="Shuffle play"
          >
            <Shuffle size={16} />
          </button>
        </div>
      </div>

      <TrackRows
        tracks={tracks}
        currentTrackId={currentTrackId}
        onPlayList={onPlayList}
        playlists={playlists}
        onAddToPlaylist={onAddToPlaylist}
        onCreatePlaylistWithTrack={onCreatePlaylistWithTrack}
      />
    </div>
  );
}
