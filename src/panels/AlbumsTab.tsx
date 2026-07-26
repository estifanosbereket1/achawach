import { useEffect, useState } from "react";
import { ShuffleIcon } from "@phosphor-icons/react";
import type { AlbumGroup } from "../hooks/useLibraryGroups";
import type { PlaylistActions, Track, TrackActions, TrackNavigation } from "../types";
import { GridCard } from "../components/GridCard";
import { TrackListDetail } from "../components/TrackListDetail";
import { shuffleArray } from "../utils";

interface AlbumsTabProps extends PlaylistActions, TrackActions, TrackNavigation {
  albums: AlbumGroup[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
  navigateToKey?: string;
  onConsumeNavigate: () => void;
  isAlbumPinned: (key: string) => boolean;
  onTogglePin: (key: string) => void;
}

export function AlbumsTab({
  albums,
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
  navigateToKey,
  onConsumeNavigate,
  isAlbumPinned,
  onTogglePin,
}: AlbumsTabProps) {
  const [selected, setSelected] = useState<AlbumGroup | null>(null);
  const allTracks = albums.flatMap((a) => a.tracks);

  useEffect(() => {
    if (!navigateToKey) return;
    const match = albums.find((a) => `${a.name} ${a.artist}` === navigateToKey);
    if (match) setSelected(match);
    onConsumeNavigate();
  }, [navigateToKey, albums, onConsumeNavigate]);

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
        onPlayNext={onPlayNext}
        onQueue={onQueue}
        onAddToFavorites={onAddToFavorites}
        onNavigateToAlbum={onNavigateToAlbum}
        onNavigateToArtist={onNavigateToArtist}
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
          <ShuffleIcon size={16} />
        </button>
      </div>

      {albums.length === 0 ? (
        <p className="track-list-empty">No albums yet.</p>
      ) : (
        <div className="grid-view">
          {albums.map((album) => {
            const key = `${album.name} ${album.artist}`;
            const trackIds = album.tracks.map((t) => t.id);
            return (
              <GridCard
                key={key}
                title={album.name}
                subtitle={album.artist}
                artworkPath={album.artworkPath}
                onClick={() => setSelected(album)}
                contextMenuItems={[
                  { label: "Play Now", onSelect: () => onPlayList(album.tracks, 0) },
                  { label: "Play Next", onSelect: () => onPlayNext(trackIds) },
                  { label: "Queue", onSelect: () => onQueue(trackIds) },
                  { label: "Add to Favs", onSelect: () => onAddToFavorites(trackIds) },
                  { label: isAlbumPinned(key) ? "Unpin" : "Pin", onSelect: () => onTogglePin(key) },
                ]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
