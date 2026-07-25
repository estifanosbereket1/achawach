import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PlaylistSummary, Track } from "../types";
import { confirmUnless } from "../utils";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);

  const refresh = useCallback(async () => {
    setPlaylists(await invoke<PlaylistSummary[]>("get_playlists"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPlaylist = useCallback(
    async (name: string) => {
      const playlistId = await invoke<number>("create_playlist", { name });
      await refresh();
      return playlistId;
    },
    [refresh],
  );

  const renamePlaylist = useCallback(
    async (playlistId: number, name: string) => {
      await invoke("rename_playlist", { playlistId, name });
      await refresh();
    },
    [refresh],
  );

  const deletePlaylist = useCallback(
    async (playlistId: number, name: string) => {
      const confirmed = await confirmUnless(false, `Delete "${name}"? This can't be undone.`, {
        title: "Delete playlist",
        kind: "warning",
      });
      if (!confirmed) return;
      await invoke("delete_playlist", { playlistId });
      await refresh();
    },
    [refresh],
  );

  const getPlaylistTracks = useCallback(async (playlistId: number) => {
    return invoke<Track[]>("get_playlist_tracks", { playlistId });
  }, []);

  const setPlaylistTracks = useCallback(
    async (playlistId: number, trackPaths: string[]) => {
      await invoke("set_playlist_tracks", { playlistId, trackPaths });
      await refresh();
    },
    [refresh],
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId: number, track: Track) => {
      const current = await getPlaylistTracks(playlistId);
      if (current.some((t) => t.id === track.id)) return;
      await setPlaylistTracks(playlistId, [...current.map((t) => t.id), track.id]);
    },
    [getPlaylistTracks, setPlaylistTracks],
  );

  const createPlaylistWithTrack = useCallback(
    async (name: string, track: Track) => {
      const playlistId = await createPlaylist(name);
      await setPlaylistTracks(playlistId, [track.id]);
    },
    [createPlaylist, setPlaylistTracks],
  );

  return {
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    getPlaylistTracks,
    setPlaylistTracks,
    addTrackToPlaylist,
    createPlaylistWithTrack,
  };
}
