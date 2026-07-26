import { useState } from "react";
import { ShuffleIcon } from "@phosphor-icons/react";
import type { ArtistGroup } from "../hooks/useLibraryGroups";
import type { PlaylistActions, Track, TrackActions } from "../types";
import { GridCard } from "../components/GridCard";
import { TrackListDetail } from "../components/TrackListDetail";
import { shuffleArray } from "../utils";

interface ArtistsTabProps extends PlaylistActions, TrackActions {
  artists: ArtistGroup[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

export function ArtistsTab({
  artists,
  currentTrackId,
  onPlayList,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
  onPlayNext,
  onQueue,
  onAddToFavorites,
}: ArtistsTabProps) {
  const [selected, setSelected] = useState<ArtistGroup | null>(null);
  const allTracks = artists.flatMap((a) => a.tracks);

  if (selected) {
    return (
      <TrackListDetail
        title={selected.name}
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
      />
    );
  }

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <span className="tab-toolbar-label">
          {artists.length} artist{artists.length === 1 ? "" : "s"}
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

      {artists.length === 0 ? (
        <p className="track-list-empty">No artists yet.</p>
      ) : (
        <div className="grid-view">
          {artists.map((artist) => (
            <GridCard
              key={artist.name}
              title={artist.name}
              subtitle={`${artist.trackCount} track${artist.trackCount === 1 ? "" : "s"}`}
              artworkPath={artist.artworkPath}
              onClick={() => setSelected(artist)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
