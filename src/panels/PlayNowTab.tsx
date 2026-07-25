import { useMemo, useState } from "react";
import type { Track } from "../types";
import { useLibraryGroups, type ArtistGroup, type AlbumGroup } from "../hooks/useLibraryGroups";
import { GridCard } from "../components/GridCard";
import { TrackListDetail } from "../components/TrackListDetail";
import { SectionHeader } from "../components/SectionHeader";
import { shuffleArray } from "../utils";

type PlayNowView =
  | { type: "dashboard" }
  | { type: "artists-full" }
  | { type: "albums-full" }
  | { type: "recent-full" }
  | { type: "artist"; artist: ArtistGroup }
  | { type: "album"; album: AlbumGroup };

const POPULAR_ARTISTS_PREVIEW = 3;
const POPULAR_ALBUMS_PREVIEW = 5;
const RECENTLY_ADDED_PREVIEW = 6;

interface PlayNowTabProps {
  tracks: Track[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

export function PlayNowTab({ tracks, currentTrackId, onPlayList }: PlayNowTabProps) {
  const groups = useLibraryGroups(tracks);
  const [view, setView] = useState<PlayNowView>({ type: "dashboard" });

  const popularArtists = useMemo(
    () => [...groups.artists].sort((a, b) => b.totalPlayCount - a.totalPlayCount),
    [groups.artists],
  );
  const popularAlbums = useMemo(
    () => [...groups.albums].sort((a, b) => b.totalPlayCount - a.totalPlayCount),
    [groups.albums],
  );
  const recentlyAdded = useMemo(
    () => [...groups.albums].sort((a, b) => b.latestDateAdded.localeCompare(a.latestDateAdded)),
    [groups.albums],
  );

  const goToDashboard = () => setView({ type: "dashboard" });

  if (view.type === "artist") {
    return (
      <TrackListDetail
        title={view.artist.name}
        artworkPath={view.artist.artworkPath}
        tracks={view.artist.tracks}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
      />
    );
  }

  if (view.type === "album") {
    return (
      <TrackListDetail
        title={view.album.name}
        subtitle={view.album.artist}
        artworkPath={view.album.artworkPath}
        tracks={view.album.tracks}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
      />
    );
  }

  if (view.type === "artists-full") {
    const allTracks = popularArtists.flatMap((a) => a.tracks);
    return (
      <div className="tab-panel">
        <SectionHeader
          title="Popular Artists"
          mode="full"
          onNavigate={goToDashboard}
          onPlay={() => onPlayList(allTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(allTracks), 0)}
          disabled={allTracks.length === 0}
        />
        <div className="grid-view">
          {popularArtists.map((artist) => (
            <GridCard
              key={artist.name}
              title={artist.name}
              subtitle={`${artist.trackCount} track${artist.trackCount === 1 ? "" : "s"}`}
              artworkPath={artist.artworkPath}
              onClick={() => setView({ type: "artist", artist })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (view.type === "albums-full") {
    const allTracks = popularAlbums.flatMap((a) => a.tracks);
    return (
      <div className="tab-panel">
        <SectionHeader
          title="Popular Albums"
          mode="full"
          onNavigate={goToDashboard}
          onPlay={() => onPlayList(allTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(allTracks), 0)}
          disabled={allTracks.length === 0}
        />
        <div className="grid-view">
          {popularAlbums.map((album) => (
            <GridCard
              key={`${album.name} ${album.artist}`}
              title={album.name}
              subtitle={album.artist}
              artworkPath={album.artworkPath}
              onClick={() => setView({ type: "album", album })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (view.type === "recent-full") {
    const allTracks = recentlyAdded.flatMap((a) => a.tracks);
    return (
      <div className="tab-panel">
        <SectionHeader
          title="Recently Added"
          mode="full"
          onNavigate={goToDashboard}
          onPlay={() => onPlayList(allTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(allTracks), 0)}
          disabled={allTracks.length === 0}
        />
        <div className="grid-view">
          {recentlyAdded.map((album) => (
            <GridCard
              key={`${album.name} ${album.artist}`}
              title={album.name}
              subtitle={album.artist}
              artworkPath={album.artworkPath}
              onClick={() => setView({ type: "album", album })}
            />
          ))}
        </div>
      </div>
    );
  }

  const popularArtistsTracks = popularArtists.flatMap((a) => a.tracks);
  const popularAlbumsTracks = popularAlbums.flatMap((a) => a.tracks);
  const recentlyAddedTracks = recentlyAdded.flatMap((a) => a.tracks);

  if (tracks.length === 0) {
    return (
      <div className="tab-panel">
        <p className="track-list-empty">Scan a folder to see your library here.</p>
      </div>
    );
  }

  return (
    <div className="pn-dashboard">
      <div className="pn-section">
        <SectionHeader
          title="Popular Artists"
          mode="preview"
          onNavigate={() => setView({ type: "artists-full" })}
          onPlay={() => onPlayList(popularArtistsTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(popularArtistsTracks), 0)}
          disabled={popularArtistsTracks.length === 0}
        />
        <div className="grid-view">
          {popularArtists.slice(0, POPULAR_ARTISTS_PREVIEW).map((artist) => (
            <GridCard
              key={artist.name}
              title={artist.name}
              subtitle={`${artist.trackCount} track${artist.trackCount === 1 ? "" : "s"}`}
              artworkPath={artist.artworkPath}
              onClick={() => setView({ type: "artist", artist })}
            />
          ))}
        </div>
      </div>

      <div className="pn-section">
        <SectionHeader
          title="Popular Albums"
          mode="preview"
          onNavigate={() => setView({ type: "albums-full" })}
          onPlay={() => onPlayList(popularAlbumsTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(popularAlbumsTracks), 0)}
          disabled={popularAlbumsTracks.length === 0}
        />
        <div className="grid-view">
          {popularAlbums.slice(0, POPULAR_ALBUMS_PREVIEW).map((album) => (
            <GridCard
              key={`${album.name} ${album.artist}`}
              title={album.name}
              subtitle={album.artist}
              artworkPath={album.artworkPath}
              onClick={() => setView({ type: "album", album })}
            />
          ))}
        </div>
      </div>

      <div className="pn-section">
        <SectionHeader
          title="Recently Added"
          mode="preview"
          onNavigate={() => setView({ type: "recent-full" })}
          onPlay={() => onPlayList(recentlyAddedTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(recentlyAddedTracks), 0)}
          disabled={recentlyAddedTracks.length === 0}
        />
        <div className="grid-view">
          {recentlyAdded.slice(0, RECENTLY_ADDED_PREVIEW).map((album) => (
            <GridCard
              key={`${album.name} ${album.artist}`}
              title={album.name}
              subtitle={album.artist}
              artworkPath={album.artworkPath}
              onClick={() => setView({ type: "album", album })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
