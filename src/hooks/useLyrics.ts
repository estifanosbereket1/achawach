import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface LyricLine {
  timeSecs: number;
  text: string;
}

export interface LyricsData {
  synced: LyricLine[] | null;
  unsynced: string | null;
}

export function useLyrics(path: string | null) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setLyrics(null);
      return;
    }
    setLoading(true);
    invoke<LyricsData>("get_lyrics", { path })
      .then(setLyrics)
      .catch(() => setLyrics(null))
      .finally(() => setLoading(false));
  }, [path]);

  return { lyrics, loading };
}
