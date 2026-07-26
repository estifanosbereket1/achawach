import { ArrowLeftIcon, CaretRightIcon, PlayIcon, ShuffleIcon } from "@phosphor-icons/react";

interface SectionHeaderProps {
  title: string;
  mode: "preview" | "full";
  onNavigate: () => void;
  onPlay: () => void;
  onShufflePlay: () => void;
  disabled?: boolean;
}

export function SectionHeader({
  title,
  mode,
  onNavigate,
  onPlay,
  onShufflePlay,
  disabled = false,
}: SectionHeaderProps) {
  return (
    <div className="pn-section-header">
      <button className="pn-section-title" onClick={onNavigate}>
        {mode === "full" && <ArrowLeftIcon size={16} />}
        <span>{title}</span>
        {mode === "preview" && <CaretRightIcon size={16} />}
      </button>
      <div className="pn-section-actions">
        <button
          className="icon-button icon-button-play"
          onClick={onPlay}
          disabled={disabled}
          aria-label={`Play ${title}`}
          title="Play"
        >
          <PlayIcon size={14} />
        </button>
        <button
          className="icon-button"
          onClick={onShufflePlay}
          disabled={disabled}
          aria-label={`Shuffle play ${title}`}
          title="Shuffle play"
        >
          <ShuffleIcon size={14} />
        </button>
      </div>
    </div>
  );
}
