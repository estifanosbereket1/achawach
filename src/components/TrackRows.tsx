import type { PlaylistActions, Track } from "../types";
import { Thumbnail } from "./Thumbnail";
import { AddToPlaylistMenu } from "./AddToPlaylistMenu";
import { formatTime } from "../utils";

interface TrackRowsProps extends PlaylistActions {
  tracks: Track[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

export function TrackRows({
  tracks,
  currentTrackId,
  onPlayList,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
}: TrackRowsProps) {
  return (
    <div className="track-list">
      {tracks.map((track, index) => (
        <div
          className={`track-row ${track.id === currentTrackId ? "track-row-active" : ""}`}
          key={track.id}
          onClick={() => onPlayList(tracks, index)}
        >
          <Thumbnail artworkPath={track.artworkPath} size={36} alt={track.album} />
          <div className="track-info">
            <span className="track-title">{track.title}</span>
            <span className="track-meta">
              {track.artist} — {track.album}
            </span>
          </div>
          <span className="track-duration mono">{formatTime(track.durationSecs)}</span>
          <AddToPlaylistMenu
            track={track}
            playlists={playlists}
            onAddToPlaylist={onAddToPlaylist}
            onCreatePlaylistWithTrack={onCreatePlaylistWithTrack}
          />
        </div>
      ))}
    </div>
  );
}
