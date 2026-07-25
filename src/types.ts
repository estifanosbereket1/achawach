export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  durationSecs: number;
}

export interface LibraryCache {
  roots: string[];
  tracks: Track[];
}

export type RepeatMode = "off" | "all" | "one";

export interface PlayerSnapshot {
  currentTrackId: string | null;
  isPaused: boolean;
  positionSecs: number;
  queue: string[];
  currentIndex: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
}
