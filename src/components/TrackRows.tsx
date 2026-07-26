import type { PlaylistActions, Track, TrackActions, TrackNavigation } from "../types";
import { Thumbnail } from "./Thumbnail";
import { AddToPlaylistMenu } from "./AddToPlaylistMenu";
import { ContextMenu } from "./ContextMenu";
import { useContextMenu } from "../hooks/useContextMenu";
import { formatTime } from "../utils";

interface TrackRowsProps extends PlaylistActions, TrackActions, TrackNavigation {
  tracks: Track[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

function TrackRow({
  track,
  index,
  tracks,
  currentTrackId,
  onPlayList,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
  onPlayNext,
  onQueue,
  onAddToFavorites,
  onNavigateToAlbum,
  onNavigateToArtist,
}: {
  track: Track;
  index: number;
} & TrackRowsProps) {
  const contextMenu = useContextMenu();

  return (
    <div
      className={`track-row ${track.id === currentTrackId ? "track-row-active" : ""}`}
      onClick={() => onPlayList(tracks, index)}
      onContextMenu={contextMenu.open}
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
      <ContextMenu
        position={contextMenu.position}
        onClose={contextMenu.close}
        items={[
          { label: "Play Now", onSelect: () => onPlayList(tracks, index) },
          { label: "Play Next", onSelect: () => onPlayNext([track.id]) },
          { label: "Queue", onSelect: () => onQueue([track.id]) },
          { label: "Add to Favs", onSelect: () => onAddToFavorites([track.id]) },
          { label: "Album", onSelect: () => onNavigateToAlbum(track) },
          { label: "Artist", onSelect: () => onNavigateToArtist(track) },
        ]}
      />
    </div>
  );
}

export function TrackRows(props: TrackRowsProps) {
  const { tracks } = props;
  return (
    <div className="track-list">
      {tracks.map((track, index) => (
        <TrackRow key={track.id} track={track} index={index} {...props} />
      ))}
    </div>
  );
}
