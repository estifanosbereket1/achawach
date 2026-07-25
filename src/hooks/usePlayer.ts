import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PlayerSnapshot, RepeatMode, Track } from "../types";

const POLL_INTERVAL_MS = 500;
const END_OF_TRACK_EPSILON_SECS = 0.75;
const REPEAT_CYCLE: RepeatMode[] = ["off", "all", "one"];

export function usePlayer(tracks: Track[]) {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const snapshotRef = useRef<PlayerSnapshot | null>(null);
  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;

  const applySnapshot = useCallback((next: PlayerSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const current = snapshotRef.current;
      if (!current || current.currentTrackId === null || current.isPaused) return;
      try {
        const next = await invoke<PlayerSnapshot>("get_position");
        const track = tracksRef.current.find((t) => t.id === next.currentTrackId);
        if (track && next.positionSecs >= track.durationSecs - END_OF_TRACK_EPSILON_SECS) {
          const advanced = await invoke<PlayerSnapshot>("next_track", { auto: true });
          applySnapshot(advanced);
        } else {
          applySnapshot(next);
        }
      } catch {
        // no track loaded yet
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [applySnapshot]);

  const playTrackList = useCallback(
    async (list: Track[], startIndex: number) => {
      const trackIds = list.map((t) => t.id);
      const next = await invoke<PlayerSnapshot>("set_queue", { trackIds, startIndex });
      applySnapshot(next);
    },
    [applySnapshot],
  );

  const togglePlayPause = useCallback(async () => {
    const command = snapshotRef.current && !snapshotRef.current.isPaused ? "pause" : "play";
    const next = await invoke<PlayerSnapshot>(command);
    applySnapshot(next);
  }, [applySnapshot]);

  const next = useCallback(async () => {
    applySnapshot(await invoke<PlayerSnapshot>("next_track", { auto: false }));
  }, [applySnapshot]);

  const prev = useCallback(async () => {
    applySnapshot(await invoke<PlayerSnapshot>("prev_track"));
  }, [applySnapshot]);

  const seek = useCallback(
    async (positionSecs: number) => {
      applySnapshot(await invoke<PlayerSnapshot>("seek", { positionSecs }));
    },
    [applySnapshot],
  );

  const setVolume = useCallback(
    async (volume: number) => {
      applySnapshot(await invoke<PlayerSnapshot>("set_volume", { volume }));
    },
    [applySnapshot],
  );

  const toggleShuffle = useCallback(async () => {
    const enabled = !(snapshotRef.current?.shuffle ?? false);
    applySnapshot(await invoke<PlayerSnapshot>("set_shuffle", { enabled }));
  }, [applySnapshot]);

  const cycleRepeat = useCallback(async () => {
    const current = snapshotRef.current?.repeat ?? "off";
    const nextMode = REPEAT_CYCLE[(REPEAT_CYCLE.indexOf(current) + 1) % REPEAT_CYCLE.length];
    applySnapshot(await invoke<PlayerSnapshot>("set_repeat", { mode: nextMode }));
  }, [applySnapshot]);

  return {
    snapshot,
    playTrackList,
    togglePlayPause,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  };
}
