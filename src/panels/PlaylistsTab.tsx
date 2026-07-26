import { useCallback, useEffect, useState } from "react";
import {
  CaretDownIcon,
  CaretUpIcon,
  FileArrowDownIcon,
  FileArrowUpIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { PlaylistActions, PlaylistSummary, Track } from "../types";
import type { ImportResult } from "../hooks/usePlaylists";
import { Thumbnail } from "../components/Thumbnail";
import { SectionHeader } from "../components/SectionHeader";
import { formatTime } from "../utils";

interface PlaylistsTabProps extends PlaylistActions {
  currentTrackId: string | null;
  onPlayList: (list: Track[], index: number) => void;
  onCreatePlaylist: (name: string) => Promise<number>;
  onRenamePlaylist: (playlistId: number, name: string) => void;
  onDeletePlaylist: (playlistId: number, name: string) => void;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  setPlaylistTracks: (playlistId: number, trackPaths: string[]) => Promise<void>;
  onExportPlaylist: (playlistId: number, suggestedName: string) => Promise<boolean>;
  onImportPlaylist: () => Promise<ImportResult | null>;
}

function PlaylistDetail({
  playlist,
  currentTrackId,
  onBack,
  onPlayList,
  getPlaylistTracks,
  setPlaylistTracks,
}: {
  playlist: PlaylistSummary;
  currentTrackId: string | null;
  onBack: () => void;
  onPlayList: (list: Track[], index: number) => void;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  setPlaylistTracks: (playlistId: number, trackPaths: string[]) => Promise<void>;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);

  const reload = useCallback(async () => {
    setTracks(await getPlaylistTracks(playlist.id));
  }, [playlist.id, getPlaylistTracks]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function persist(next: Track[]) {
    setTracks(next);
    await setPlaylistTracks(
      playlist.id,
      next.map((t) => t.id),
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...tracks];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    persist(next);
  }

  function moveDown(index: number) {
    if (index === tracks.length - 1) return;
    const next = [...tracks];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    persist(next);
  }

  function removeTrack(index: number) {
    persist(tracks.filter((_, i) => i !== index));
  }

  return (
    <div className="tab-panel">
      <SectionHeader
        title={playlist.name}
        mode="full"
        onNavigate={onBack}
        onPlay={() => onPlayList(tracks, 0)}
        onShufflePlay={() => onPlayList([...tracks].sort(() => Math.random() - 0.5), 0)}
        disabled={tracks.length === 0}
      />
      {tracks.length === 0 ? (
        <p className="track-list-empty">Empty — add tracks from the + button anywhere a track is shown.</p>
      ) : (
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
              <div className="playlist-row-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="icon-button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  <CaretUpIcon size={14} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => moveDown(index)}
                  disabled={index === tracks.length - 1}
                  aria-label="Move down"
                >
                  <CaretDownIcon size={14} />
                </button>
                <button className="icon-button" onClick={() => removeTrack(index)} aria-label="Remove from playlist">
                  <XIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlaylistsTab({
  playlists,
  currentTrackId,
  onPlayList,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  getPlaylistTracks,
  setPlaylistTracks,
  onExportPlaylist,
  onImportPlaylist,
}: PlaylistsTabProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);

  async function handleImport() {
    const result = await onImportPlaylist();
    if (!result) return;
    setImportMessage(`Imported ${result.matched} of ${result.total} tracks (some may not be in your library).`);
  }

  const selected = playlists.find((p) => p.id === selectedId);
  if (selected) {
    return (
      <PlaylistDetail
        playlist={selected}
        currentTrackId={currentTrackId}
        onBack={() => setSelectedId(null)}
        onPlayList={onPlayList}
        getPlaylistTracks={getPlaylistTracks}
        setPlaylistTracks={setPlaylistTracks}
      />
    );
  }

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="New playlist name…"
          value={newName}
          onChange={(e) => setNewName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              onCreatePlaylist(newName.trim());
              setNewName("");
            }
          }}
        />
        <button
          className="icon-button"
          disabled={!newName.trim()}
          onClick={() => {
            onCreatePlaylist(newName.trim());
            setNewName("");
          }}
          aria-label="Create playlist"
        >
          <PlusIcon size={16} />
        </button>
        <button className="icon-button" onClick={handleImport} aria-label="Import M3U playlist" title="Import M3U">
          <FileArrowUpIcon size={16} />
        </button>
      </div>

      {importMessage && (
        <div className="dropdown-empty" onClick={() => setImportMessage(null)}>
          {importMessage}
        </div>
      )}

      {playlists.length === 0 ? (
        <p className="track-list-empty">No playlists yet.</p>
      ) : (
        <div className="genre-list">
          {playlists.map((playlist) =>
            renamingId === playlist.id ? (
              <div className="playlist-rename-row" key={playlist.id}>
                <input
                  className="search-input"
                  type="text"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameValue.trim()) {
                      onRenamePlaylist(playlist.id, renameValue.trim());
                      setRenamingId(null);
                    } else if (e.key === "Escape") {
                      setRenamingId(null);
                    }
                  }}
                />
                <button
                  className="icon-button"
                  onClick={() => {
                    if (renameValue.trim()) onRenamePlaylist(playlist.id, renameValue.trim());
                    setRenamingId(null);
                  }}
                  aria-label="Confirm rename"
                >
                  <PlusIcon size={14} />
                </button>
              </div>
            ) : (
              <div className="genre-row" key={playlist.id} onClick={() => setSelectedId(playlist.id)}>
                <span className="genre-name">{playlist.name}</span>
                <span className="track-meta">
                  {playlist.trackCount} track{playlist.trackCount === 1 ? "" : "s"}
                </span>
                <div className="playlist-row-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-button"
                    onClick={() => onExportPlaylist(playlist.id, playlist.name)}
                    aria-label="Export as M3U"
                    title="Export as M3U"
                  >
                    <FileArrowDownIcon size={14} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => {
                      setRenamingId(playlist.id);
                      setRenameValue(playlist.name);
                    }}
                    aria-label="Rename playlist"
                  >
                    <PencilSimpleIcon size={14} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => onDeletePlaylist(playlist.id, playlist.name)}
                    aria-label="Delete playlist"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
