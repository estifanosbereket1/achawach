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

  const persistRoots = useCallback(async (nextRoots: string[]) => {
    await storeRef.current?.set("roots", nextRoots);
  }, []);

  const rescan = useCallback(async (rootsToScan: string[]) => {
    setIsScanning(true);
    try {
      const scanned = await invoke<Track[]>("scan_folders", { roots: rootsToScan });
      setTracks(scanned);
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const store = await Store.load(STORE_PATH);
      storeRef.current = store;
      const savedRoots = (await store.get<string[]>("roots")) ?? [];
      setRoots(savedRoots);

      const library = await invoke<Track[]>("get_library");
      setTracks(library);
      setIsLoaded(true);

      if (savedRoots.length > 0 && library.length === 0) {
        await rescan(savedRoots);
      }
    })();
  }, [rescan]);

  const addRoots = useCallback(async () => {
    const selection = await open({ directory: true, multiple: true });
    if (!selection) return;
    const picked = Array.isArray(selection) ? selection : [selection];
    const nextRoots = Array.from(new Set([...roots, ...picked]));
    if (nextRoots.length === roots.length) return;
    setRoots(nextRoots);
    await persistRoots(nextRoots);
    await rescan(nextRoots);
  }, [roots, persistRoots, rescan]);

  const removeRoot = useCallback(
    async (root: string) => {
      const confirmed = await confirmUnless(false, `Remove "${root}" from your library?`, {
        title: "Remove folder",
        kind: "warning",
      });
      if (!confirmed) return;

      const nextRoots = roots.filter((r) => r !== root);
      setRoots(nextRoots);
      await persistRoots(nextRoots);
      await rescan(nextRoots);
    },
    [roots, persistRoots, rescan],
  );

  return {
    roots,
    tracks,
    isScanning,
    isLoaded,
    addRoots,
    removeRoot,
    rescan: () => rescan(roots),
  };
}
