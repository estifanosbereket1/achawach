import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Store } from "@tauri-apps/plugin-store";
import type { Track } from "../types";
import { confirmUnless } from "../utils";

const STORE_PATH = "library.json";

export function useMusicLibrary() {
  const [roots, setRoots] = useState<string[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<Store | null>(null);

  const persist = useCallback(async (nextRoots: string[], nextTracks: Track[]) => {
    const store = storeRef.current;
    if (!store) return;
    await store.set("roots", nextRoots);
    await store.set("tracks", nextTracks);
  }, []);

  const rescan = useCallback(
    async (rootsToScan?: string[]) => {
      const targetRoots = rootsToScan ?? roots;
      if (targetRoots.length === 0) return;
      setIsScanning(true);
      try {
        const scanned = await invoke<Track[]>("scan_folders", { roots: targetRoots });
        setTracks(scanned);
        await persist(targetRoots, scanned);
      } finally {
        setIsScanning(false);
      }
    },
    [roots, persist],
  );

  useEffect(() => {
    (async () => {
      const store = await Store.load(STORE_PATH);
      storeRef.current = store;
      const savedRoots = (await store.get<string[]>("roots")) ?? [];
      const savedTracks = (await store.get<Track[]>("tracks")) ?? [];
      setRoots(savedRoots);
      setTracks(savedTracks);
      setIsLoaded(true);

      if (savedRoots.length > 0 && savedTracks.length === 0) {
        await rescan(savedRoots);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  const addRoots = useCallback(async () => {
    const selection = await open({ directory: true, multiple: true });
    if (!selection) return;
    const picked = Array.isArray(selection) ? selection : [selection];
    const nextRoots = Array.from(new Set([...roots, ...picked]));
    if (nextRoots.length === roots.length) return;
    setRoots(nextRoots);
    await persist(nextRoots, tracks);
    await rescan(nextRoots);
  }, [roots, tracks, persist, rescan]);

  const removeRoot = useCallback(
    async (root: string) => {
      const confirmed = await confirmUnless(false, `Remove "${root}" from your library?`, {
        title: "Remove folder",
        kind: "warning",
      });
      if (!confirmed) return;

      const nextRoots = roots.filter((r) => r !== root);
      const nextTracks = tracks.filter((t) => !t.path.startsWith(root));
      setRoots(nextRoots);
      setTracks(nextTracks);
      await persist(nextRoots, nextTracks);
    },
    [roots, tracks, persist],
  );

  return {
    roots,
    tracks,
    isScanning,
    isLoaded,
    addRoots,
    removeRoot,
    rescan: () => rescan(),
  };
}
