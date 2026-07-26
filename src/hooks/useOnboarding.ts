import { useEffect, useRef, useState } from "react";
import { Store } from "@tauri-apps/plugin-store";

const STORE_PATH = "onboarding.json";

export function useOnboarding() {
  const [completed, setCompleted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<Store | null>(null);

  useEffect(() => {
    (async () => {
      const store = await Store.load(STORE_PATH);
      storeRef.current = store;
      const done = (await store.get<boolean>("completed")) ?? false;
      setCompleted(done);
      setIsLoaded(true);
    })();
  }, []);

  async function finish() {
    setCompleted(true);
    await storeRef.current?.set("completed", true);
  }

  return { completed, isLoaded, finish };
}
