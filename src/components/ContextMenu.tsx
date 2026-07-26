import { useEffect, useRef } from "react";

const MENU_WIDTH = 180;
const ITEM_HEIGHT = 30;
const MENU_PADDING = 12;
const EDGE_MARGIN = 8;

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [position, onClose]);

  if (!position) return null;

  const estimatedHeight = items.length * ITEM_HEIGHT + MENU_PADDING;
  const left = Math.min(position.x, window.innerWidth - MENU_WIDTH - EDGE_MARGIN);
  const top = Math.min(position.y, window.innerHeight - estimatedHeight - EDGE_MARGIN);

  return (
    <div
      className="context-menu"
      ref={ref}
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          className="dropdown-item"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
