import { RootChip } from "../components/RootChip";
import { EqualizerPanel } from "./EqualizerPanel";
import { confirmUnless } from "../utils";

const ACCENT_PRESETS = [
  { name: "Sunset", value: "#f7803c" },
  { name: "Ember", value: "#f54828" },
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
  isUninstallable: boolean;
  isUninstalling: boolean;
  uninstallError: string | null;
  onUninstall: () => void;
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
  isUninstallable,
  isUninstalling,
  uninstallError,
  onUninstall,
}: SettingsPanelProps) {
  async function handleUninstallClick() {
    const confirmed = await confirmUnless(
      false,
      "Uninstall achawatch? This removes the app from your computer — your music library and settings are kept.",
      { title: "Uninstall achawatch", kind: "warning" },
    );
    if (confirmed) onUninstall();
  }

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

      {isUninstallable && (
        <>
          <h3 className="settings-heading">Uninstall</h3>
          {uninstallError && <div className="dropdown-empty">{uninstallError}</div>}
          <button className="pill-button pill-button-danger" disabled={isUninstalling} onClick={handleUninstallClick}>
            {isUninstalling ? "Uninstalling…" : "Uninstall achawatch"}
          </button>
        </>
      )}
    </div>
  );
}
