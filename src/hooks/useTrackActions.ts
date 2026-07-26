import { useCallback } from "react";
import type { PlayerSnapshot, PlaylistSummary, Track } from "../types";

const FAVORITES_PLAYLIST_NAME = "Favorites";

interface UseTrackActionsArgs {
  tracks: Track[];
  snapshot: PlayerSnapshot | null;
  playlists: PlaylistSummary[];
  onPlayList: (list: Track[], index: number) => void;
  onReorderQueue: (trackIds: string[]) => void;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  setPlaylistTracks: (playlistId: number, trackPaths: string[]) => Promise<void>;
  onCreatePlaylist: (name: string) => Promise<number>;
}

export function useTrackActions({
  tracks,
  snapshot,
  playlists,
  onPlayList,
  onReorderQueue,
  getPlaylistTracks,
  setPlaylistTracks,
  onCreatePlaylist,
}: UseTrackActionsArgs) {
  const resolveTracks = useCallback(
    (trackIds: string[]) =>
      trackIds.map((id) => tracks.find((t) => t.id === id)).filter((t): t is Track => t !== undefined),
    [tracks],
  );

  const onPlayNext = useCallback(
    (trackIds: string[]) => {
      if (!snapshot || snapshot.currentTrackId === null) {
        onPlayList(resolveTracks(trackIds), 0);
        return;
      }
      const queue = [...snapshot.queue];
      queue.splice(snapshot.currentIndex + 1, 0, ...trackIds);
      onReorderQueue(queue);
    },
    [snapshot, onPlayList, onReorderQueue, resolveTracks],
  );

  const onQueue = useCallback(
    (trackIds: string[]) => {
      if (!snapshot || snapshot.currentTrackId === null) {
        onPlayList(resolveTracks(trackIds), 0);
        return;
      }
      onReorderQueue([...snapshot.queue, ...trackIds]);
    },
    [snapshot, onPlayList, onReorderQueue, resolveTracks],
  );

  const onAddToFavorites = useCallback(
    async (trackIds: string[]) => {
      const existing = playlists.find((p) => p.name === FAVORITES_PLAYLIST_NAME);
      const playlistId = existing ? existing.id : await onCreatePlaylist(FAVORITES_PLAYLIST_NAME);
      const current = await getPlaylistTracks(playlistId);
      const currentIds = new Set(current.map((t) => t.id));
      const merged = [...current.map((t) => t.id), ...trackIds.filter((id) => !currentIds.has(id))];
      await setPlaylistTracks(playlistId, merged);
    },
    [playlists, onCreatePlaylist, getPlaylistTracks, setPlaylistTracks],
  );

  return { onPlayNext, onQueue, onAddToFavorites };
}
