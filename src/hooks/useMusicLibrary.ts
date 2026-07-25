import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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
  const rootsRef = useRef<string[]>([]);
  rootsRef.current = roots;

  const persistRoots = useCallback(async (nextRoots: string[]) => {
    await storeRef.current?.set("roots", nextRoots);
  }, []);

  const syncWatcher = useCallback(async (nextRoots: string[]) => {
    await invoke("set_watched_roots", { roots: nextRoots }).catch(() => {});
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
      await syncWatcher(savedRoots);

      const library = await invoke<Track[]>("get_library");
      setTracks(library);
      setIsLoaded(true);

      if (savedRoots.length > 0 && library.length === 0) {
        await rescan(savedRoots);
      }
    })();
  }, [rescan, syncWatcher]);

  // Detects new/removed files in already-scanned folders (e.g. downloaded
  // in the background) without requiring a manual rescan click.
  useEffect(() => {
    const unlistenPromise = listen("library-changed", () => {
      if (rootsRef.current.length > 0) {
        rescan(rootsRef.current);
      }
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [rescan]);

  const addRoots = useCallback(async () => {
    const selection = await open({ directory: true, multiple: true });
    if (!selection) return;
    const picked = Array.isArray(selection) ? selection : [selection];
    const nextRoots = Array.from(new Set([...roots, ...picked]));
    if (nextRoots.length === roots.length) return;
    setRoots(nextRoots);
    await persistRoots(nextRoots);
    await syncWatcher(nextRoots);
    await rescan(nextRoots);
  }, [roots, persistRoots, syncWatcher, rescan]);

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
      await syncWatcher(nextRoots);
      await rescan(nextRoots);
    },
    [roots, persistRoots, syncWatcher, rescan],
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
