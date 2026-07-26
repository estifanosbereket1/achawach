import { ArrowLeftIcon, MusicNoteIcon, PlayIcon, ShuffleIcon } from "@phosphor-icons/react";
import type { PlaylistActions, Track, TrackActions, TrackNavigation } from "../types";
import { Thumbnail } from "./Thumbnail";
import { TrackRows } from "./TrackRows";
import { shuffleArray } from "../utils";

type IconComponent = typeof MusicNoteIcon;

interface TrackListDetailProps extends PlaylistActions, TrackActions, TrackNavigation {
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
  onPlayNext,
  onQueue,
  onAddToFavorites,
  onNavigateToAlbum,
  onNavigateToArtist,
}: TrackListDetailProps) {
  return (
    <div className="detail-view">
      <button className="icon-button" onClick={onBack} aria-label="Back">
        <ArrowLeftIcon size={16} />
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
            <PlayIcon size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => onPlayList(shuffleArray(tracks), 0)}
            disabled={tracks.length === 0}
            aria-label="Shuffle play"
            title="Shuffle play"
          >
            <ShuffleIcon size={16} />
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
        onPlayNext={onPlayNext}
        onQueue={onQueue}
        onAddToFavorites={onAddToFavorites}
        onNavigateToAlbum={onNavigateToAlbum}
        onNavigateToArtist={onNavigateToArtist}
      />
    </div>
  );
}
