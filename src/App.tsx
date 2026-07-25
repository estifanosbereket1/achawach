import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { Store } from "@tauri-apps/plugin-store";
import "./App.css";

const ORB_SIZE = 64;
const DOCK_WIDTH = 820;
const DOCK_HEIGHT = 560;
const DOCK_TOP_MARGIN = 24;

function App() {
  const [expanded, setExpanded] = useState(false);
  const orbPosition = useRef<{ x: number; y: number } | null>(null);
  const [pluginCheck, setPluginCheck] = useState("checking...");

  useEffect(() => {
    (async () => {
      try {
        const store = await Store.load("plugin-check.json");
        await store.set("ping", Date.now());
        const value = await store.get<number>("ping");
        setPluginCheck(value !== undefined ? `store ok (${value})` : "store returned nothing");
      } catch (err) {
        setPluginCheck(`store error: ${String(err)}`);
      }
    })();
  }, []);

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
            <p className="dock-placeholder">
              achawatch dock — player UI coming soon
              <br />
              <span className="mono">{pluginCheck}</span>
            </p>
          </div>
        ) : (
          <div className="orb-dot" />
        )}
      </div>
    </div>
  );
}

export default App;
