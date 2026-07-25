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
