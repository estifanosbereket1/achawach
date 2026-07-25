import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { PlaylistSummary, Track } from "../types";
import { confirmUnless } from "../utils";

const M3U_FILTERS = [{ name: "M3U Playlist", extensions: ["m3u", "m3u8"] }];

export interface ImportResult {
  playlistId: number;
  matched: number;
  total: number;
}

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

  const exportPlaylist = useCallback(async (playlistId: number, suggestedName: string) => {
    const filePath = await save({
      title: "Export playlist",
      defaultPath: `${suggestedName}.m3u`,
      filters: M3U_FILTERS,
    });
    if (!filePath) return false;
    await invoke("export_playlist_m3u", { playlistId, filePath });
    return true;
  }, []);

  const importPlaylist = useCallback(async (): Promise<ImportResult | null> => {
    const filePath = await open({ title: "Import playlist", filters: M3U_FILTERS });
    if (!filePath || Array.isArray(filePath)) return null;

    const fileName = filePath.split("/").pop() ?? "Imported Playlist";
    const playlistName = fileName.replace(/\.m3u8?$/i, "");
    const result = await invoke<ImportResult>("import_playlist_m3u", { filePath, playlistName });
    await refresh();
    return result;
  }, [refresh]);

  return {
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    getPlaylistTracks,
    setPlaylistTracks,
    addTrackToPlaylist,
    createPlaylistWithTrack,
    exportPlaylist,
    importPlaylist,
  };
}
