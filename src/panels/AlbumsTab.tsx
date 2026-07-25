import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { AlbumGroup } from "../hooks/useLibraryGroups";
import type { PlaylistActions, Track } from "../types";
import { GridCard } from "../components/GridCard";
import { TrackListDetail } from "../components/TrackListDetail";
import { shuffleArray } from "../utils";

interface AlbumsTabProps extends PlaylistActions {
  albums: AlbumGroup[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

export function AlbumsTab({
  albums,
  currentTrackId,
  onPlayList,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
}: AlbumsTabProps) {
  const [selected, setSelected] = useState<AlbumGroup | null>(null);
  const allTracks = albums.flatMap((a) => a.tracks);

  if (selected) {
    return (
      <TrackListDetail
        title={selected.name}
        subtitle={selected.artist}
        artworkPath={selected.artworkPath}
        tracks={selected.tracks}
        currentTrackId={currentTrackId}
        onBack={() => setSelected(null)}
        onPlayList={onPlayList}
        playlists={playlists}
        onAddToPlaylist={onAddToPlaylist}
        onCreatePlaylistWithTrack={onCreatePlaylistWithTrack}
      />
    );
  }

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <span className="tab-toolbar-label">
          {albums.length} album{albums.length === 1 ? "" : "s"}
        </span>
        <button
          className="icon-button"
          onClick={() => onPlayList(shuffleArray(allTracks), 0)}
          disabled={allTracks.length === 0}
          aria-label="Shuffle play all"
          title="Shuffle play all"
        >
          <Shuffle size={16} />
        </button>
      </div>

      {albums.length === 0 ? (
        <p className="track-list-empty">No albums yet.</p>
      ) : (
        <div className="grid-view">
          {albums.map((album) => (
            <GridCard
              key={`${album.name} ${album.artist}`}
              title={album.name}
              subtitle={album.artist}
              artworkPath={album.artworkPath}
              onClick={() => setSelected(album)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
