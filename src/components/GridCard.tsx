import { Thumbnail } from "./Thumbnail";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { useContextMenu } from "../hooks/useContextMenu";

interface GridCardProps {
  title: string;
  subtitle?: string;
  artworkPath: string | null;
  onClick: () => void;
  contextMenuItems?: ContextMenuItem[];
}

export function GridCard({ title, subtitle, artworkPath, onClick, contextMenuItems }: GridCardProps) {
  const contextMenu = useContextMenu();

  return (
    <div
      className="grid-card"
      onClick={onClick}
      onContextMenu={contextMenuItems ? contextMenu.open : undefined}
    >
      <Thumbnail artworkPath={artworkPath} size={96} alt={title} />
      <span className="grid-card-title">{title}</span>
      {subtitle && <span className="grid-card-subtitle">{subtitle}</span>}
      {contextMenuItems && (
        <ContextMenu position={contextMenu.position} onClose={contextMenu.close} items={contextMenuItems} />
      )}
    </div>
  );
}
