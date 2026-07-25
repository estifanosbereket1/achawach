import { RootChip } from "../components/RootChip";
import { EqualizerPanel } from "./EqualizerPanel";

const ACCENT_PRESETS = [
  { name: "Amber", value: "#ff9f5b" },
  { name: "Teal", value: "#5eead4" },
  { name: "Violet", value: "#a78bfa" },
  { name: "Rose", value: "#fb7185" },
  { name: "Sky", value: "#38bdf8" },
];

interface SettingsPanelProps {
  accent: string;
  opacity: number;
  onAccentChange: (value: string) => void;
  onOpacityChange: (value: number) => void;
  roots: string[];
  isScanning: boolean;
  onAddRoots: () => void;
  onRemoveRoot: (root: string) => void;
  onRescan: () => void;
  eqGains: number[];
  onSetEqBand: (index: number, value: number) => void;
  onSetEqGains: (gains: number[]) => void;
}

export function SettingsPanel({
  accent,
  opacity,
  onAccentChange,
  onOpacityChange,
  roots,
  isScanning,
  onAddRoots,
  onRemoveRoot,
  onRescan,
  eqGains,
  onSetEqBand,
  onSetEqGains,
}: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <h3 className="settings-heading">Music Folders</h3>
      <div className="root-row">
        {roots.map((root) => (
          <RootChip key={root} path={root} onRemove={() => onRemoveRoot(root)} />
        ))}
        <button className="pill-button" onClick={onAddRoots}>
          + Add Folder
        </button>
        <button className="pill-button" onClick={onRescan} disabled={isScanning || roots.length === 0}>
          {isScanning ? "Scanning…" : "Rescan"}
        </button>
      </div>

      <h3 className="settings-heading">Accent Color</h3>
      <div className="accent-swatch-row">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.value}
            className={`accent-swatch ${accent === preset.value ? "accent-swatch-active" : ""}`}
            style={{ background: preset.value }}
            onClick={() => onAccentChange(preset.value)}
            title={preset.name}
            aria-label={preset.name}
          />
        ))}
      </div>

      <h3 className="settings-heading">Dock Opacity</h3>
      <input
        type="range"
        min={0.2}
        max={0.9}
        step={0.01}
        value={opacity}
        onChange={(e) => onOpacityChange(Number(e.currentTarget.value))}
      />

      <h3 className="settings-heading">Equalizer</h3>
      <EqualizerPanel gains={eqGains} onSetBand={onSetEqBand} onSetGains={onSetEqGains} />
    </div>
  );
}
