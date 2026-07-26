import { useCallback, useEffect, useRef, useState } from "react";
import { Store } from "@tauri-apps/plugin-store";

const STORE_PATH = "settings.json";
const DEFAULT_ACCENT = "#f7803c";
const DEFAULT_OPACITY = 0.55;
const DEFAULT_VOLUME = 1;

export function useSettings() {
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [opacity, setOpacityState] = useState(DEFAULT_OPACITY);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<Store | null>(null);

  useEffect(() => {
    (async () => {
      const store = await Store.load(STORE_PATH);
      storeRef.current = store;

      const savedAccent = (await store.get<string>("accent")) ?? DEFAULT_ACCENT;
      const savedOpacity = (await store.get<number>("opacity")) ?? DEFAULT_OPACITY;
      const savedVolume = (await store.get<number>("volume")) ?? DEFAULT_VOLUME;

      document.documentElement.style.setProperty("--accent", savedAccent);
      document.documentElement.style.setProperty("--dock-opacity", String(savedOpacity));

      setAccentState(savedAccent);
      setOpacityState(savedOpacity);
      setVolumeState(savedVolume);
      setIsLoaded(true);
    })();
  }, []);

  const setAccent = useCallback((value: string) => {
    document.documentElement.style.setProperty("--accent", value);
    setAccentState(value);
    void storeRef.current?.set("accent", value);
  }, []);

  const setOpacity = useCallback((value: number) => {
    document.documentElement.style.setProperty("--dock-opacity", String(value));
    setOpacityState(value);
    void storeRef.current?.set("opacity", value);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    void storeRef.current?.set("volume", value);
  }, []);

  return { accent, opacity, volume, isLoaded, setAccent, setOpacity, setVolume };
}
