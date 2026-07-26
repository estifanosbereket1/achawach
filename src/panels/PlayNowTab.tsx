import { useMemo, useState } from "react";
import type { PlaylistActions, Track, TrackActions, TrackNavigation } from "../types";
import { useLibraryGroups, type ArtistGroup, type AlbumGroup } from "../hooks/useLibraryGroups";
import { useMonthlyPlayCounts } from "../hooks/useMonthlyPlayCounts";
import { GridCard } from "../components/GridCard";
import { TrackListDetail } from "../components/TrackListDetail";
import { TrackSectionPage } from "../components/TrackSectionPage";
import { SectionHeader } from "../components/SectionHeader";
import { StatsFooter } from "../components/StatsFooter";
import { shuffleArray } from "../utils";

type PlayNowView =
  | { type: "dashboard" }
  | { type: "artists-full" }
  | { type: "albums-full" }
  | { type: "recent-full" }
  | { type: "most-played-full" }
  | { type: "recently-played-full" }
  | { type: "instant-mix-full" }
  | { type: "never-played-full" }
  | { type: "monthly-full" }
  | { type: "artist"; artist: ArtistGroup }
  | { type: "album"; album: AlbumGroup };

const POPULAR_ARTISTS_PREVIEW = 3;
const POPULAR_ALBUMS_PREVIEW = 5;
const RECENTLY_ADDED_PREVIEW = 6;
const TRACK_SECTION_PREVIEW = 6;
const INSTANT_MIX_POOL_SIZE = 30;

interface PlayNowTabProps extends PlaylistActions, TrackActions, TrackNavigation {
  tracks: Track[];
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
}

interface TrackPreviewSectionProps {
  title: string;
  tracks: Track[];
  onExpand: () => void;
  onPlayList: (list: Track[], index: number) => void;
}

function TrackPreviewSection({ title, tracks, onExpand, onPlayList }: TrackPreviewSectionProps) {
  const preview = tracks.slice(0, TRACK_SECTION_PREVIEW);
  return (
    <div className="pn-section">
      <SectionHeader
        title={title}
        mode="preview"
        onNavigate={onExpand}
        onPlay={() => onPlayList(tracks, 0)}
        onShufflePlay={() => onPlayList(shuffleArray(tracks), 0)}
        disabled={tracks.length === 0}
      />
      {tracks.length === 0 ? (
        <p className="track-list-empty">Nothing here yet.</p>
      ) : (
        <div className="track-scroll-row">
          {preview.map((track, index) => (
            <GridCard
              key={track.id}
              title={track.title}
              subtitle={track.artist}
              artworkPath={track.artworkPath}
              onClick={() => onPlayList(tracks, index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlayNowTab({
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
}: PlayNowTabProps) {
  const groups = useLibraryGroups(tracks);
  const monthlyPlayCounts = useMonthlyPlayCounts();
  const [view, setView] = useState<PlayNowView>({ type: "dashboard" });
  const [instantMixPool] = useState<Track[]>(() => shuffleArray(tracks).slice(0, INSTANT_MIX_POOL_SIZE));
  const playlistProps: PlaylistActions = { playlists, onAddToPlaylist, onCreatePlaylistWithTrack };
  const trackActionsProps: TrackActions = { onPlayNext, onQueue, onAddToFavorites };
  const trackNavProps: TrackNavigation = { onNavigateToAlbum, onNavigateToArtist };

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

  const mostPlayed = useMemo(
    () => tracks.filter((t) => t.playCount > 0).sort((a, b) => b.playCount - a.playCount),
    [tracks],
  );
  const recentlyPlayed = useMemo(
    () =>
      tracks
        .filter((t) => t.lastPlayed)
        .sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? "")),
    [tracks],
  );
  const neverPlayed = useMemo(() => tracks.filter((t) => t.playCount === 0), [tracks]);

  const monthlyCountByPath = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of monthlyPlayCounts) map.set(m.path, m.count);
    return map;
  }, [monthlyPlayCounts]);

  const mostPlayedThisMonth = useMemo(
    () =>
      tracks
        .filter((t) => monthlyCountByPath.has(t.id))
        .sort((a, b) => (monthlyCountByPath.get(b.id) ?? 0) - (monthlyCountByPath.get(a.id) ?? 0)),
    [tracks, monthlyCountByPath],
  );

  const timePlayedThisMonthSecs = useMemo(() => {
    return tracks.reduce((sum, t) => sum + (monthlyCountByPath.get(t.id) ?? 0) * t.durationSecs, 0);
  }, [tracks, monthlyCountByPath]);

  const totalTimePlayedSecs = useMemo(
    () => tracks.reduce((sum, t) => sum + t.playCount * t.durationSecs, 0),
    [tracks],
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
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
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
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
      />
    );
  }

  if (view.type === "artists-full" || view.type === "albums-full" || view.type === "recent-full") {
    const groupList =
      view.type === "artists-full" ? popularArtists : view.type === "albums-full" ? popularAlbums : recentlyAdded;
    const title =
      view.type === "artists-full" ? "Popular Artists" : view.type === "albums-full" ? "Popular Albums" : "Recently Added";
    const allTracks = groupList.flatMap((g) => g.tracks);
    return (
      <div className="tab-panel">
        <SectionHeader
          title={title}
          mode="full"
          onNavigate={goToDashboard}
          onPlay={() => onPlayList(allTracks, 0)}
          onShufflePlay={() => onPlayList(shuffleArray(allTracks), 0)}
          disabled={allTracks.length === 0}
        />
        <div className="grid-view">
          {view.type === "artists-full"
            ? (groupList as ArtistGroup[]).map((artist) => (
                <GridCard
                  key={artist.name}
                  title={artist.name}
                  subtitle={`${artist.trackCount} track${artist.trackCount === 1 ? "" : "s"}`}
                  artworkPath={artist.artworkPath}
                  onClick={() => setView({ type: "artist", artist })}
                />
              ))
            : (groupList as AlbumGroup[]).map((album) => (
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

  if (view.type === "most-played-full") {
    return (
      <TrackSectionPage
        title="Most Played"
        tracks={mostPlayed}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
      />
    );
  }

  if (view.type === "recently-played-full") {
    return (
      <TrackSectionPage
        title="Recently Played"
        tracks={recentlyPlayed}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
      />
    );
  }

  if (view.type === "instant-mix-full") {
    return (
      <TrackSectionPage
        title="Instant Mix"
        tracks={instantMixPool}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
      />
    );
  }

  if (view.type === "never-played-full") {
    return (
      <TrackSectionPage
        title="Never Played"
        tracks={neverPlayed}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
      />
    );
  }

  if (view.type === "monthly-full") {
    return (
      <TrackSectionPage
        title="Most Played This Month"
        tracks={mostPlayedThisMonth}
        currentTrackId={currentTrackId}
        onBack={goToDashboard}
        onPlayList={onPlayList}
        {...playlistProps}
        {...trackActionsProps}
        {...trackNavProps}
      />
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="tab-panel">
        <p className="track-list-empty">Scan a folder to see your library here.</p>
      </div>
    );
  }

  const popularArtistsTracks = popularArtists.flatMap((a) => a.tracks);
  const popularAlbumsTracks = popularAlbums.flatMap((a) => a.tracks);
  const recentlyAddedTracks = recentlyAdded.flatMap((a) => a.tracks);
  const neverPlayedCount = neverPlayed.length;

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

      <TrackPreviewSection
        title="Most Played"
        tracks={mostPlayed}
        onExpand={() => setView({ type: "most-played-full" })}
        onPlayList={onPlayList}
      />

      <TrackPreviewSection
        title="Recently Played"
        tracks={recentlyPlayed}
        onExpand={() => setView({ type: "recently-played-full" })}
        onPlayList={onPlayList}
      />

      <TrackPreviewSection
        title="Instant Mix"
        tracks={instantMixPool}
        onExpand={() => setView({ type: "instant-mix-full" })}
        onPlayList={onPlayList}
      />

      <TrackPreviewSection
        title="Never Played"
        tracks={neverPlayed}
        onExpand={() => setView({ type: "never-played-full" })}
        onPlayList={onPlayList}
      />

      <TrackPreviewSection
        title="Most Played This Month"
        tracks={mostPlayedThisMonth}
        onExpand={() => setView({ type: "monthly-full" })}
        onPlayList={onPlayList}
      />

      <StatsFooter
        totalTracks={tracks.length}
        totalArtists={groups.artists.length}
        totalAlbums={groups.albums.length}
        totalGenres={groups.genres.length}
        neverPlayedCount={neverPlayedCount}
        playedCount={tracks.length - neverPlayedCount}
        tracksPlayedThisMonth={mostPlayedThisMonth.length}
        timePlayedThisMonthSecs={timePlayedThisMonthSecs}
        totalTimePlayedSecs={totalTimePlayedSecs}
      />
    </div>
  );
}
