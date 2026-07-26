import { useState } from "react";
import {
  BellIcon,
  ClosedCaptioningIcon,
  CompassIcon,
  FadersHorizontalIcon,
  FolderSimpleIcon,
  KeyboardIcon,
  MoonIcon,
  PlayIcon,
  QueueIcon,
} from "@phosphor-icons/react";

interface OnboardingWizardProps {
  roots: string[];
  isScanning: boolean;
  onAddRoots: () => void;
  onFinish: () => void;
}

type Step = "welcome" | "folders" | "tips";
const STEPS: Step[] = ["welcome", "folders", "tips"];

const FEATURES = [
  { icon: FolderSimpleIcon, label: "Scan your own music folders" },
  { icon: PlayIcon, label: "Queue, shuffle & repeat playback" },
  { icon: FadersHorizontalIcon, label: "10-band equalizer" },
  { icon: QueueIcon, label: "Playlists with M3U import/export" },
  { icon: ClosedCaptioningIcon, label: "Synced lyrics" },
  { icon: MoonIcon, label: "Sleep timer" },
  { icon: BellIcon, label: "Track-change notifications" },
  { icon: KeyboardIcon, label: "Media-key (MPRIS) support" },
];

const TIPS = [
  "Click any track, artist, album, genre, or playlist row to start playing it.",
  "The tabs along the top switch between Play Now, Tracks, Artists, Albums, Genres, and Playlists.",
  "The gear icon (top-left) opens Settings — manage folders, accent color, and the equalizer from there.",
  "The mini orb docks anywhere on your screen — drag it around, click to expand, click the × to collapse.",
];

export function OnboardingWizard({ roots, isScanning, onAddRoots, onFinish }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("welcome");
  const stepIndex = STEPS.indexOf(step);

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  return (
    <div className="onboarding">
      <div className="onboarding-step-dots">
        {STEPS.map((s) => (
          <div key={s} className={`onboarding-dot ${s === step ? "onboarding-dot-active" : ""}`} />
        ))}
      </div>

      {step === "welcome" && (
        <div className="onboarding-body">
          <img className="onboarding-hero-logo" src="/achawatch.png" alt="achawatch" />
          <h2 className="onboarding-title">Welcome to achawatch</h2>
          <p className="onboarding-subtitle">A glassmorphic tray music player for your own local library.</p>
          <div className="onboarding-feature-grid">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div className="onboarding-feature" key={label}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button className="pill-button-primary" onClick={goNext}>
            Get Started
          </button>
        </div>
      )}

      {step === "folders" && (
        <div className="onboarding-body">
          <FolderSimpleIcon size={40} className="onboarding-hero-icon" />
          <h2 className="onboarding-title">Add your music</h2>
          <p className="onboarding-subtitle">
            Choose one or more folders on your computer. achawatch will scan them and keep watching for changes.
          </p>

          {roots.length > 0 && (
            <div className="onboarding-root-list">
              {roots.map((root) => (
                <div className="root-chip" key={root} title={root}>
                  <span className="root-chip-label">{root.length > 40 ? `…${root.slice(-37)}` : root}</span>
                </div>
              ))}
            </div>
          )}

          <button className="pill-button-primary" onClick={onAddRoots} disabled={isScanning}>
            {isScanning ? "Scanning…" : "Choose Folder…"}
          </button>

          <div className="onboarding-nav">
            <button className="pill-button" onClick={goBack}>
              Back
            </button>
            {roots.length > 0 ? (
              <button className="pill-button-primary" onClick={goNext}>
                Continue
              </button>
            ) : (
              <button className="pill-button" onClick={goNext}>
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}

      {step === "tips" && (
        <div className="onboarding-body">
          <CompassIcon size={40} className="onboarding-hero-icon" />
          <h2 className="onboarding-title">Quick tips</h2>
          <ul className="onboarding-tips">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <div className="onboarding-nav">
            <button className="pill-button" onClick={goBack}>
              Back
            </button>
            <button className="pill-button-primary" onClick={onFinish}>
              Start Listening
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
