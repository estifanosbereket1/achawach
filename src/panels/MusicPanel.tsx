import { useState } from "react";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import type { PlayerSnapshot, PlaylistActions, Track } from "../types";
import { useLibraryGroups } from "../hooks/useLibraryGroups";
import { Thumbnail } from "../components/Thumbnail";
import { AddToPlaylistMenu } from "../components/AddToPlaylistMenu";
import { PlayNowTab } from "./PlayNowTab";
import { TracksTab } from "./TracksTab";
import { ArtistsTab } from "./ArtistsTab";
import { AlbumsTab } from "./AlbumsTab";
import { GenresTab } from "./GenresTab";
import { PlaylistsTab } from "./PlaylistsTab";
import { formatTime } from "../utils";

const ICON_SIZE = 16;

type LibraryTab = "playnow" | "tracks" | "artists" | "albums" | "genres" | "playlists";

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "playnow", label: "Play Now" },
  { id: "tracks", label: "Tracks" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "genres", label: "Genres" },
  { id: "playlists", label: "Playlists" },
];

interface MusicPanelProps extends PlaylistActions {
  tracks: Track[];
  snapshot: PlayerSnapshot | null;
  onPlayList: (list: Track[], index: number) => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (positionSecs: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onCreatePlaylist: (name: string) => Promise<number>;
  onRenamePlaylist: (playlistId: number, name: string) => void;
  onDeletePlaylist: (playlistId: number, name: string) => void;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  setPlaylistTracks: (playlistId: number, trackPaths: string[]) => Promise<void>;
}

export function MusicPanel({
  tracks,
  snapshot,
  onPlayList,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  getPlaylistTracks,
  setPlaylistTracks,
}: MusicPanelProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>("playnow");
  const groups = useLibraryGroups(tracks);
  const playlistProps: PlaylistActions = { playlists, onAddToPlaylist, onCreatePlaylistWithTrack };

  const currentTrack = tracks.find((t) => t.id === snapshot?.currentTrackId) ?? null;
  const position = snapshot?.positionSecs ?? 0;
  const duration = currentTrack?.durationSecs ?? 0;

  return (
    <div className="music-panel">
      <div className="library-tab-row">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`pill-button ${activeTab === tab.id ? "icon-button-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="library-tab-content">
        {activeTab === "playnow" && (
          <PlayNowTab
            tracks={tracks}
            currentTrackId={snapshot?.currentTrackId ?? null}
            onPlayList={onPlayList}
            {...playlistProps}
          />
        )}
        {activeTab === "tracks" && (
          <TracksTab
            tracks={tracks}
            currentTrackId={snapshot?.currentTrackId ?? null}
            onPlayList={onPlayList}
            {...playlistProps}
          />
        )}
        {activeTab === "artists" && (
          <ArtistsTab
            artists={groups.artists}
            currentTrackId={snapshot?.currentTrackId ?? null}
            onPlayList={onPlayList}
            {...playlistProps}
          />
        )}
        {activeTab === "albums" && (
          <AlbumsTab
            albums={groups.albums}
            currentTrackId={snapshot?.currentTrackId ?? null}
            onPlayList={onPlayList}
            {...playlistProps}
          />
        )}
        {activeTab === "genres" && (
          <GenresTab
            genres={groups.genres}
            currentTrackId={snapshot?.currentTrackId ?? null}
            onPlayList={onPlayList}
            {...playlistProps}
          />
        )}
        {activeTab === "playlists" && (
          <PlaylistsTab
            currentTrackId={snapshot?.currentTrackId ?? null}
            onPlayList={onPlayList}
            onCreatePlaylist={onCreatePlaylist}
            onRenamePlaylist={onRenamePlaylist}
            onDeletePlaylist={onDeletePlaylist}
            getPlaylistTracks={getPlaylistTracks}
            setPlaylistTracks={setPlaylistTracks}
            {...playlistProps}
          />
        )}
      </div>

      <div className="transport-bar">
        <div className="transport-now-playing">
          <Thumbnail artworkPath={currentTrack?.artworkPath ?? null} size={44} alt={currentTrack?.album} />
          <div className="transport-now-playing-info">
            <span className="track-title">{currentTrack?.title ?? "Nothing playing"}</span>
            <span className="track-meta">{currentTrack?.artist ?? ""}</span>
          </div>
          {currentTrack && (
            <AddToPlaylistMenu
              track={currentTrack}
              playlists={playlists}
              onAddToPlaylist={onAddToPlaylist}
              onCreatePlaylistWithTrack={onCreatePlaylistWithTrack}
            />
          )}
        </div>

        <div className="transport-progress">
          <span className="mono transport-time">{formatTime(position)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(position, duration || 1)}
            disabled={!currentTrack}
            onChange={(e) => onSeek(Number(e.currentTarget.value))}
          />
          <span className="mono transport-time">{formatTime(duration)}</span>
        </div>

        <div className="transport-controls">
          <button
            className={`icon-button ${snapshot?.shuffle ? "icon-button-active" : ""}`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >
            <Shuffle size={ICON_SIZE} />
          </button>
          <button className="icon-button" onClick={onPrev} disabled={!currentTrack} aria-label="Previous">
            <SkipBack size={ICON_SIZE} />
          </button>
          <button
            className="icon-button icon-button-play"
            onClick={onTogglePlayPause}
            disabled={!currentTrack}
            aria-label={snapshot && !snapshot.isPaused ? "Pause" : "Play"}
          >
            {snapshot && !snapshot.isPaused ? <Pause size={ICON_SIZE} /> : <Play size={ICON_SIZE} />}
          </button>
          <button className="icon-button" onClick={onNext} disabled={!currentTrack} aria-label="Next">
            <SkipForward size={ICON_SIZE} />
          </button>
          <button
            className={`icon-button ${snapshot && snapshot.repeat !== "off" ? "icon-button-active" : ""}`}
            onClick={onCycleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${snapshot?.repeat ?? "off"}`}
          >
            {snapshot?.repeat === "one" ? <Repeat1 size={ICON_SIZE} /> : <Repeat size={ICON_SIZE} />}
          </button>
          <div className="transport-volume">
            <span>Vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={snapshot?.volume ?? 1}
              onChange={(e) => onVolumeChange(Number(e.currentTarget.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
