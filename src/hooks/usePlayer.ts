import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PlayerSnapshot, RepeatMode, Track } from "../types";
import { notifyTrackChange } from "../notifications";

const POLL_INTERVAL_MS = 500;
const END_OF_TRACK_EPSILON_SECS = 0.75;
const PLAY_RECORD_THRESHOLD = 0.5;
const REPEAT_CYCLE: RepeatMode[] = ["off", "all", "one"];

export function usePlayer(tracks: Track[]) {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const snapshotRef = useRef<PlayerSnapshot | null>(null);
  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;

  const recordedRef = useRef(false);
  const lastForRecordRef = useRef<{ trackId: string | null; position: number }>({
    trackId: null,
    position: 0,
  });

  const maybeRecordPlay = useCallback((next: PlayerSnapshot) => {
    const prev = lastForRecordRef.current;
    const isNewPlaythrough =
      next.currentTrackId !== prev.trackId || next.positionSecs < prev.position - 1;
    if (isNewPlaythrough) {
      recordedRef.current = false;
    }
    lastForRecordRef.current = { trackId: next.currentTrackId, position: next.positionSecs };

    if (recordedRef.current || !next.currentTrackId) return;
    const track = tracksRef.current.find((t) => t.id === next.currentTrackId);
    if (!track || track.durationSecs <= 0) return;
    if (next.positionSecs >= track.durationSecs * PLAY_RECORD_THRESHOLD) {
      recordedRef.current = true;
      invoke("record_play", { path: next.currentTrackId }).catch(() => {});
    }
  }, []);

  const lastNotifiedTrackIdRef = useRef<string | null>(null);

  const maybeNotifyTrackChange = useCallback((next: PlayerSnapshot) => {
    if (!next.currentTrackId || next.currentTrackId === lastNotifiedTrackIdRef.current) return;
    lastNotifiedTrackIdRef.current = next.currentTrackId;
    const track = tracksRef.current.find((t) => t.id === next.currentTrackId);
    if (track) {
      notifyTrackChange(track).catch((err) => console.error("[notifications] failed:", err));
    }
  }, []);

  const applySnapshot = useCallback(
    (next: PlayerSnapshot) => {
      snapshotRef.current = next;
      setSnapshot(next);
      maybeRecordPlay(next);
      maybeNotifyTrackChange(next);
    },
    [maybeRecordPlay, maybeNotifyTrackChange],
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      const current = snapshotRef.current;
      if (!current || current.currentTrackId === null) return;
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

  const jumpToIndex = useCallback(
    async (index: number) => {
      applySnapshot(await invoke<PlayerSnapshot>("jump_to_index", { index }));
    },
    [applySnapshot],
  );

  const reorderQueue = useCallback(
    async (trackIds: string[]) => {
      applySnapshot(await invoke<PlayerSnapshot>("reorder_queue", { trackIds }));
    },
    [applySnapshot],
  );

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
    jumpToIndex,
    reorderQueue,
  };
}
