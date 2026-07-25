import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";

export const EQ_BAND_LABELS = ["31", "62", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
const NUM_BANDS = EQ_BAND_LABELS.length;
const STORE_PATH = "settings.json";
const DEFAULT_GAINS: number[] = new Array(NUM_BANDS).fill(0);

export function useEqualizer() {
  const [gains, setGainsState] = useState<number[]>(DEFAULT_GAINS);
  const storeRef = useRef<Store | null>(null);

  useEffect(() => {
    (async () => {
      const store = await Store.load(STORE_PATH);
      storeRef.current = store;
      const saved = (await store.get<number[]>("eqGains")) ?? DEFAULT_GAINS;
      setGainsState(saved);
      await invoke("set_eq_gains", { gains: saved });
    })();
  }, []);

  const setGains = useCallback((next: number[]) => {
    setGainsState(next);
    invoke("set_eq_gains", { gains: next }).catch(() => {});
    void storeRef.current?.set("eqGains", next);
  }, []);

  const setBand = useCallback(
    (index: number, value: number) => {
      const next = [...gains];
      next[index] = value;
      setGains(next);
    },
    [gains, setGains],
  );

  return { gains, setBand, setGains };
}
