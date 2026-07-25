interface RootChipProps {
  path: string;
  onRemove: () => void;
}

export function RootChip({ path, onRemove }: RootChipProps) {
  const label = path.length > 40 ? `…${path.slice(-37)}` : path;

  return (
    <div className="root-chip" title={path}>
      <span className="root-chip-label">{label}</span>
      <button className="root-chip-remove" onClick={onRemove} aria-label={`Remove ${path}`}>
        ×
      </button>
    </div>
  );
}
