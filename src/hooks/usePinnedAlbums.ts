import { useCallback, useEffect, useRef, useState } from "react";
import { Store } from "@tauri-apps/plugin-store";

const STORE_PATH = "pinned.json";

export function usePinnedAlbums() {
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<Store | null>(null);

  useEffect(() => {
    (async () => {
      const store = await Store.load(STORE_PATH);
      storeRef.current = store;
      const saved = (await store.get<string[]>("albums")) ?? [];
      setPinnedKeys(saved);
      setIsLoaded(true);
    })();
  }, []);

  const isPinned = useCallback((key: string) => pinnedKeys.includes(key), [pinnedKeys]);

  const togglePin = useCallback((key: string) => {
    setPinnedKeys((current) => {
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      storeRef.current?.set("albums", next);
      return next;
    });
  }, []);

  return { pinnedKeys, isLoaded, isPinned, togglePin };
}
