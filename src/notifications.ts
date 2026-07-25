import { invoke } from "@tauri-apps/api/core";
import type { Track } from "./types";

// Bypasses the webview's `window.Notification` API and tauri-plugin-notification
// entirely: on this webkit2gtk build, both silently reported success without
// ever reaching the OS notification daemon. This calls `notify-rust` directly
// via our own command, which does work (confirmed against a raw `notify-send`
// baseline) and actually surfaces errors instead of swallowing them.
export async function notifyTrackChange(track: Track): Promise<void> {
  await invoke("send_notification", {
    title: track.title,
    body: `${track.artist} — ${track.album}`,
    iconPath: track.artworkPath,
  });
}
