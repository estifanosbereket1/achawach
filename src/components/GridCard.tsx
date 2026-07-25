import { Thumbnail } from "./Thumbnail";

interface GridCardProps {
  title: string;
  subtitle?: string;
  artworkPath: string | null;
  onClick: () => void;
}

export function GridCard({ title, subtitle, artworkPath, onClick }: GridCardProps) {
  return (
    <div className="grid-card" onClick={onClick}>
      <Thumbnail artworkPath={artworkPath} size={96} alt={title} />
      <span className="grid-card-title">{title}</span>
      {subtitle && <span className="grid-card-subtitle">{subtitle}</span>}
    </div>
  );
}
