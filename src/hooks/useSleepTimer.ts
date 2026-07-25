import { useCallback, useEffect, useRef, useState } from "react";

export function useSleepTimer(onExpire: () => void) {
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (remainingSecs === null) return;
    if (remainingSecs <= 0) {
      onExpireRef.current();
      setRemainingSecs(null);
      return;
    }
    const timeout = setTimeout(() => setRemainingSecs((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remainingSecs]);

  const startTimer = useCallback((seconds: number) => {
    setRemainingSecs(seconds);
  }, []);

  const cancelTimer = useCallback(() => setRemainingSecs(null), []);

  return { remainingSecs, startTimer, cancelTimer };
}
