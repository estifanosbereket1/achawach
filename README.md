<p align="center">
  <img src="public/achawatch.png" width="96" alt="achawatch logo" />
</p>

<h1 align="center">achawatch</h1>

<p align="center">A glassmorphic tray music player for Linux, built with Tauri.</p>

achawatch lives as a small transparent orb docked to your desktop —
draggable, and showing the current track's artwork with a play/pause badge
right on the orb itself. Click it and it expands into a full library
dashboard; click away and it collapses back down. It scans your own music
folders, keeps a local SQLite library with cached artwork, and plays
everything through a native Rust audio pipeline — no cloud, no accounts, no
telemetry.

## Features

- **Library** — point it at one or more folders; it scans `mp3`/`flac`/`ogg`/`m4a`/`wav`,
  reads tags and embedded artwork, and organizes everything into Tracks,
  Artists, Albums, Genres, and Playlists tabs
- **First-run onboarding** — a short welcome flow that introduces the app,
  helps you add your first music folder, and shows a few quick tips
- **Playback** — queue, shuffle, repeat (off/all/one), seek, volume, and a
  10-band equalizer
- **Right-click menus** — right-click (or two-finger-click) a track, album,
  or artist for Play Now / Play Next / Queue / Add to Favs, plus quick
  navigation to that track's album or artist; albums also get a Pin option
- **Favorites** — "Add to Favs" collects tracks into an auto-managed
  Favorites playlist, right alongside your own playlists
- **Pinned albums** — pin albums for quick access from a dedicated section
  at the top of the Play Now tab
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
- **In-app uninstall** — remove achawatch from Settings without needing a
  terminal (installed `.deb` builds only)

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

MIT — see [LICENSE](LICENSE).
