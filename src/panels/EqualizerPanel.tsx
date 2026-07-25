import { EQ_BAND_LABELS } from "../hooks/useEqualizer";

const PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  Vocal: [-2, -2, 0, 2, 4, 4, 2, 0, -1, -2],
  "Treble Boost": [0, 0, 0, 0, 0, 1, 2, 4, 5, 6],
};

interface EqualizerPanelProps {
  gains: number[];
  onSetBand: (index: number, value: number) => void;
  onSetGains: (gains: number[]) => void;
}

export function EqualizerPanel({ gains, onSetBand, onSetGains }: EqualizerPanelProps) {
  return (
    <div className="equalizer-panel">
      <div className="eq-presets">
        {Object.entries(PRESETS).map(([name, values]) => (
          <button key={name} className="pill-button" onClick={() => onSetGains(values)}>
            {name}
          </button>
        ))}
      </div>
      <div className="eq-bands">
        {EQ_BAND_LABELS.map((label, i) => (
          <div className="eq-band" key={label}>
            <span className="eq-band-value mono">{gains[i] > 0 ? `+${gains[i]}` : gains[i]}</span>
            <div className="eq-slider-wrap">
              <input
                className="eq-slider"
                type="range"
                min={-12}
                max={12}
                step={1}
                value={gains[i] ?? 0}
                onChange={(e) => onSetBand(i, Number(e.currentTarget.value))}
              />
            </div>
            <span className="eq-band-label mono">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
