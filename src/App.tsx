import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { Settings } from "lucide-react";
import { useMusicLibrary } from "./hooks/useMusicLibrary";
import { usePlayer } from "./hooks/usePlayer";
import { useSettings } from "./hooks/useSettings";
import { usePlaylists } from "./hooks/usePlaylists";
import { useEqualizer } from "./hooks/useEqualizer";
import { MusicPanel } from "./panels/MusicPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import "./App.css";

const ORB_SIZE = 64;
const DOCK_WIDTH = 820;
const DOCK_HEIGHT = 560;
const DOCK_TOP_MARGIN = 24;

type PanelId = "music" | "settings";

function App() {
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<PanelId>("music");
  const orbPosition = useRef<{ x: number; y: number } | null>(null);
  const library = useMusicLibrary();
  const player = usePlayer(library.tracks);
  const settings = useSettings();
  const playlists = usePlaylists();
  const equalizer = useEqualizer();

  useEffect(() => {
    if (settings.isLoaded) {
      player.setVolume(settings.volume);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.isLoaded]);

  function handleVolumeChange(volume: number) {
    player.setVolume(volume);
    settings.setVolume(volume);
  }

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
            <button
              className="settings-toggle-btn"
              onClick={() => setPanel(panel === "music" ? "settings" : "music")}
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>

            {panel === "music" ? (
              <MusicPanel
                tracks={library.tracks}
                snapshot={player.snapshot}
                onPlayList={(list, index) => player.playTrackList(list, index)}
                onTogglePlayPause={player.togglePlayPause}
                onNext={player.next}
                onPrev={player.prev}
                onSeek={player.seek}
                onVolumeChange={handleVolumeChange}
                onToggleShuffle={player.toggleShuffle}
                onCycleRepeat={player.cycleRepeat}
                onJumpToIndex={player.jumpToIndex}
                onReorderQueue={player.reorderQueue}
                playlists={playlists.playlists}
                onAddToPlaylist={playlists.addTrackToPlaylist}
                onCreatePlaylistWithTrack={playlists.createPlaylistWithTrack}
                onCreatePlaylist={playlists.createPlaylist}
                onRenamePlaylist={playlists.renamePlaylist}
                onDeletePlaylist={playlists.deletePlaylist}
                getPlaylistTracks={playlists.getPlaylistTracks}
                setPlaylistTracks={playlists.setPlaylistTracks}
              />
            ) : (
              <SettingsPanel
                accent={settings.accent}
                opacity={settings.opacity}
                onAccentChange={settings.setAccent}
                onOpacityChange={settings.setOpacity}
                roots={library.roots}
                isScanning={library.isScanning}
                onAddRoots={library.addRoots}
                onRemoveRoot={library.removeRoot}
                onRescan={library.rescan}
                eqGains={equalizer.gains}
                onSetEqBand={equalizer.setBand}
                onSetEqGains={equalizer.setGains}
              />
            )}
          </div>
        ) : (
          <div className="orb-dot" />
        )}
      </div>
    </div>
  );
}

export default App;
