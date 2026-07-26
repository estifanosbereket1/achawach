<p align="center">
  <img src="public/achawatch.png" width="96" alt="achawatch logo" />
</p>

<h1 align="center">achawatch</h1>

<p align="center">A glassmorphic tray music player for Linux, built with Tauri.</p>

achawatch lives as a small transparent orb docked to your desktop. Click it
and it expands into a full library dashboard; click away and it collapses
back down. It scans your own music folders, keeps a local SQLite library
with cached artwork, and plays everything through a native Rust audio
pipeline — no cloud, no accounts, no telemetry.

## Features

- **Library** — point it at one or more folders; it scans `mp3`/`flac`/`ogg`/`m4a`/`wav`,
  reads tags and embedded artwork, and organizes everything into Tracks,
  Artists, Albums, Genres, and Playlists tabs
- **Playback** — queue, shuffle, repeat (off/all/one), seek, volume, and a
  10-band equalizer
- **Playlists** — create, rename, delete, reorder, and import/export as `.m3u`
- **Play stats** — monthly play-count history per track
- **Sleep timer** — auto-pause after a chosen duration
- **Folder auto-watch** — the library re-scans automatically when files
  change on disk
- **Lyrics** — synced or plain lyrics display for the current track
- **Notifications** — a desktop notification on track change
- **MPRIS media keys** — play/pause/next/previous from your keyboard or
  desktop shell's media widget, like any other native Linux media player
- **System tray** — show/hide and quit from the tray icon

## Tech stack

- [Tauri v2](https://tauri.app/) (Rust backend, WebView2/WebKitGTK frontend)
- Rust: `rodio` (audio), `sqlx` + SQLite (library), `lofty` (tag/artwork
  reading), `mpris-server` (media keys), `notify-rust` (notifications),
  `notify` (folder watching)
- React 19 + TypeScript, plain CSS (no framework), [Phosphor Icons](https://phosphoricons.com/)

## Development

```bash
npm install
npm run tauri dev
```

## Building

```bash
npm run tauri build
```

Produces a release binary and platform bundles (`.deb`, AppImage, etc. on
Linux) under `src-tauri/target/release/bundle/`.

## Known caveats

- The tray icon requires the "AppIndicator and KStatusNotifierItem Support"
  extension on stock GNOME — without it, GNOME Shell won't render
  application tray icons at all.
- Desktop notifications on track change may not visually render depending on
  your WebKitGTK/notification-daemon combination; the notification is still
  sent correctly over D-Bus.

## License

TBD.
