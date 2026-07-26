import { useState } from "react";
import { ShuffleIcon } from "@phosphor-icons/react";
import type { GenreGroup } from "../hooks/useLibraryGroups";
import type { PlaylistActions, Track, TrackActions, TrackNavigation } from "../types";
import { TrackListDetail } from "../components/TrackListDetail";
import { getGenreIcon } from "../genreIcons";
import { shuffleArray } from "../utils";

interface GenresTabProps extends PlaylistActions, TrackActions, TrackNavigation {
  genres: GenreGroup[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

export function GenresTab({
  genres,
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
}: GenresTabProps) {
  const [selected, setSelected] = useState<GenreGroup | null>(null);
  const allTracks = genres.flatMap((g) => g.tracks);

  if (selected) {
    return (
      <TrackListDetail
        title={selected.name}
        artworkPath={null}
        fallbackIcon={getGenreIcon(selected.name)}
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
          {genres.length} genre{genres.length === 1 ? "" : "s"}
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

      {genres.length === 0 ? (
        <p className="track-list-empty">No genres yet.</p>
      ) : (
        <div className="genre-list">
          {genres.map((genre) => {
            const GenreIcon = getGenreIcon(genre.name);
            return (
              <div className="genre-row" key={genre.name} onClick={() => setSelected(genre)}>
                <div className="genre-icon">
                  <GenreIcon size={18} />
                </div>
                <span className="genre-name">{genre.name}</span>
                <span className="track-meta">
                  {genre.trackCount} track{genre.trackCount === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
