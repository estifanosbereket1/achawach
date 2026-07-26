import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { convertFileSrc } from "@tauri-apps/api/core";
import { GearIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { useMusicLibrary } from "./hooks/useMusicLibrary";
import { usePlayer } from "./hooks/usePlayer";
import { useSettings } from "./hooks/useSettings";
import { usePlaylists } from "./hooks/usePlaylists";
import { useEqualizer } from "./hooks/useEqualizer";
import { useSleepTimer } from "./hooks/useSleepTimer";
import { useOnboarding } from "./hooks/useOnboarding";
import { useUninstall } from "./hooks/useUninstall";
import { MusicPanel } from "./panels/MusicPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { OnboardingWizard } from "./components/OnboardingWizard";
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
  const orbDragStart = useRef<{ x: number; y: number } | null>(null);
  const orbDragging = useRef(false);
  const library = useMusicLibrary();
  const player = usePlayer(library.tracks);
  const settings = useSettings();
  const playlists = usePlaylists();
  const equalizer = useEqualizer();
  const onboarding = useOnboarding();
  const uninstall = useUninstall();
  const sleepTimer = useSleepTimer(() => {
    if (player.snapshot && !player.snapshot.isPaused) {
      player.togglePlayPause();
    }
  });
  const showOnboarding = onboarding.isLoaded && !onboarding.completed;
  const currentTrack = library.tracks.find((t) => t.id === player.snapshot?.currentTrackId) ?? null;

  useEffect(() => {
    if (settings.isLoaded) {
      player.setVolume(settings.volume);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.isLoaded]);

  useEffect(() => {
    if (showOnboarding && !expanded) {
      expand();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboarding]);

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

  // The orb needs to be both draggable (to reposition it on screen) and
  // clickable (to expand it), so we detect real pointer movement ourselves
  // and only hand off to the native window drag once a small threshold is
  // crossed — otherwise a plain click always reaches `expand()`.
  useEffect(() => {
    if (expanded) return;

    function onMouseMove(e: MouseEvent) {
      if (!orbDragStart.current || orbDragging.current) return;
      const dx = e.clientX - orbDragStart.current.x;
      const dy = e.clientY - orbDragStart.current.y;
      if (Math.hypot(dx, dy) > 4) {
        orbDragging.current = true;
        getCurrentWindow().startDragging();
      }
    }

    function onMouseUp() {
      orbDragStart.current = null;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [expanded]);

  function handleOrbMouseDown(e: ReactMouseEvent) {
    if (e.button !== 0) return;
    orbDragStart.current = { x: e.clientX, y: e.clientY };
  }

  function handleOrbClick() {
    if (orbDragging.current) {
      orbDragging.current = false;
      return;
    }
    expand();
  }

  function handleOrbBadgeClick(e: ReactMouseEvent) {
    e.stopPropagation();
    if (orbDragging.current) {
      orbDragging.current = false;
      return;
    }
    player.togglePlayPause();
  }

  return (
    <div className={expanded ? "dock" : "orb"}>
      <div
        className="shell-inner"
        onMouseDown={expanded ? undefined : handleOrbMouseDown}
        onClick={expanded ? undefined : handleOrbClick}
      >
        {expanded ? (
          <div className="dock-content">
            {/* Only bare (non-"deep") data-tauri-drag-region, and no children of its own,
                so this exact element must be the click target — it can never swallow
                clicks on the tab row, buttons, or track rows below it. */}
            <div className="dock-drag-handle" data-tauri-drag-region />
            <button className="collapse-btn" onClick={collapse}>
              ×
            </button>
            {!showOnboarding && (
              <button
                className="settings-toggle-btn"
                onClick={() => setPanel(panel === "music" ? "settings" : "music")}
                aria-label="Settings"
              >
                <GearIcon size={16} />
              </button>
            )}

            {showOnboarding ? (
              <OnboardingWizard
                roots={library.roots}
                isScanning={library.isScanning}
                onAddRoots={library.addRoots}
                onFinish={onboarding.finish}
              />
            ) : panel === "music" ? (
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
                sleepTimerRemainingSecs={sleepTimer.remainingSecs}
                onStartSleepTimer={sleepTimer.startTimer}
                onCancelSleepTimer={sleepTimer.cancelTimer}
                playlists={playlists.playlists}
                onAddToPlaylist={playlists.addTrackToPlaylist}
                onCreatePlaylistWithTrack={playlists.createPlaylistWithTrack}
                onCreatePlaylist={playlists.createPlaylist}
                onRenamePlaylist={playlists.renamePlaylist}
                onDeletePlaylist={playlists.deletePlaylist}
                getPlaylistTracks={playlists.getPlaylistTracks}
                setPlaylistTracks={playlists.setPlaylistTracks}
                onExportPlaylist={playlists.exportPlaylist}
                onImportPlaylist={playlists.importPlaylist}
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
                isUninstallable={uninstall.isAvailable}
                isUninstalling={uninstall.isUninstalling}
                uninstallError={uninstall.error}
                onUninstall={uninstall.uninstall}
              />
            )}
          </div>
        ) : currentTrack ? (
          <div className="orb-now-playing" title={`${currentTrack.title} — ${currentTrack.artist}`}>
            {currentTrack.artworkPath ? (
              <img
                className="orb-artwork"
                src={convertFileSrc(currentTrack.artworkPath)}
                alt={currentTrack.album}
                draggable={false}
              />
            ) : (
              <img className="orb-dot orb-artwork-fallback" src="/achawatch.png" alt="achawatch" draggable={false} />
            )}
            <button
              className="orb-status-badge"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleOrbBadgeClick}
              aria-label={player.snapshot && !player.snapshot.isPaused ? "Pause" : "Play"}
            >
              {player.snapshot && !player.snapshot.isPaused ? <PauseIcon size={10} /> : <PlayIcon size={10} />}
            </button>
          </div>
        ) : (
          <img className="orb-dot" src="/achawatch.png" alt="achawatch" draggable={false} />
        )}
      </div>
    </div>
  );
}

export default App;
