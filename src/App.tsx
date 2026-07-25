import { useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { useMusicLibrary } from "./hooks/useMusicLibrary";
import { usePlayer } from "./hooks/usePlayer";
import { MusicPanel } from "./panels/MusicPanel";
import "./App.css";

const ORB_SIZE = 64;
const DOCK_WIDTH = 820;
const DOCK_HEIGHT = 560;
const DOCK_TOP_MARGIN = 24;

function App() {
  const [expanded, setExpanded] = useState(false);
  const orbPosition = useRef<{ x: number; y: number } | null>(null);
  const library = useMusicLibrary();
  const player = usePlayer(library.tracks);

  async function expand() {
    const win = getCurrentWindow();
    const physicalPos = await win.outerPosition();
    const scaleFactor = await win.scaleFactor();
    const logicalPos = physicalPos.toLogical(scaleFactor);
    orbPosition.current = { x: logicalPos.x, y: logicalPos.y };

    await win.setSize(new LogicalSize(DOCK_WIDTH, DOCK_HEIGHT));
    const dockX = Math.round((window.screen.width - DOCK_WIDTH) / 2);
    await win.setPosition(new LogicalPosition(dockX, DOCK_TOP_MARGIN));
    setExpanded(true);
  }

  async function collapse() {
    const win = getCurrentWindow();
    await win.setSize(new LogicalSize(ORB_SIZE, ORB_SIZE));
    if (orbPosition.current) {
      await win.setPosition(new LogicalPosition(orbPosition.current.x, orbPosition.current.y));
    }
    setExpanded(false);
  }

  return (
    <div className={expanded ? "dock" : "orb"} data-tauri-drag-region>
      <div className="shell-inner" onClick={expanded ? undefined : expand}>
        {expanded ? (
          <div className="dock-content">
            <button className="collapse-btn" onClick={collapse}>
              ×
            </button>
            <MusicPanel
              roots={library.roots}
              tracks={library.tracks}
              isScanning={library.isScanning}
              onAddRoots={library.addRoots}
              onRemoveRoot={library.removeRoot}
              onRescan={library.rescan}
              snapshot={player.snapshot}
              onTrackClick={(_, index) => player.playTrackList(library.tracks, index)}
              onTogglePlayPause={player.togglePlayPause}
              onNext={player.next}
              onPrev={player.prev}
              onSeek={player.seek}
              onVolumeChange={player.setVolume}
            />
          </div>
        ) : (
          <div className="orb-dot" />
        )}
      </div>
    </div>
  );
}

export default App;
