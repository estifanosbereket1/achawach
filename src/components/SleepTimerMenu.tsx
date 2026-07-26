import { MoonIcon } from "@phosphor-icons/react";
import { Dropdown } from "./Dropdown";

const PRESETS = [
  { label: "30 sec (test)", seconds: 30 },
  { label: "15 minutes", seconds: 15 * 60 },
  { label: "30 minutes", seconds: 30 * 60 },
  { label: "45 minutes", seconds: 45 * 60 },
  { label: "60 minutes", seconds: 60 * 60 },
];

interface SleepTimerMenuProps {
  remainingSecs: number | null;
  onStart: (seconds: number) => void;
  onCancel: () => void;
}

function formatRemaining(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SleepTimerMenu({ remainingSecs, onStart, onCancel }: SleepTimerMenuProps) {
  return (
    <Dropdown
      align="right"
      direction="up"
      trigger={
        <button
          className={`icon-button ${remainingSecs !== null ? "icon-button-active" : ""}`}
          aria-label="Sleep timer"
          title="Sleep timer"
        >
          <MoonIcon size={16} />
        </button>
      }
    >
      {(close) =>
        remainingSecs !== null ? (
          <>
            <div className="dropdown-empty mono">{formatRemaining(remainingSecs)} remaining</div>
            <button
              className="dropdown-item"
              onClick={() => {
                onCancel();
                close();
              }}
            >
              Cancel timer
            </button>
          </>
        ) : (
          PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="dropdown-item"
              onClick={() => {
                onStart(preset.seconds);
                close();
              }}
            >
              {preset.label}
            </button>
          ))
        )
      }
    </Dropdown>
  );
}
