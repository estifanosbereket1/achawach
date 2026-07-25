export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  durationSecs: number;
  artworkPath: string | null;
  trackNumber: number | null;
  dateAdded: string;
  playCount: number;
  lastPlayed: string | null;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  trackCount: number;
}

export interface PlaylistActions {
  playlists: PlaylistSummary[];
  onAddToPlaylist: (playlistId: number, track: Track) => void;
  onCreatePlaylistWithTrack: (name: string, track: Track) => void;
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
