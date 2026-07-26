import { useCallback, useState, type MouseEvent as ReactMouseEvent } from "react";

export function useContextMenu() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const open = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => setPosition(null), []);

  return { position, open, close };
}
