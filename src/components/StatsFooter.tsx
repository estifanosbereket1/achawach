import { formatDuration } from "../utils";

interface StatsFooterProps {
  totalTracks: number;
  totalArtists: number;
  totalAlbums: number;
  totalGenres: number;
  neverPlayedCount: number;
  playedCount: number;
  tracksPlayedThisMonth: number;
  timePlayedThisMonthSecs: number;
  totalTimePlayedSecs: number;
}

export function StatsFooter({
  totalTracks,
  totalArtists,
  totalAlbums,
  totalGenres,
  neverPlayedCount,
  playedCount,
  tracksPlayedThisMonth,
  timePlayedThisMonthSecs,
  totalTimePlayedSecs,
}: StatsFooterProps) {
  const stats: [string, string][] = [
    ["Tracks", String(totalTracks)],
    ["Artists", String(totalArtists)],
    ["Albums", String(totalAlbums)],
    ["Genres", String(totalGenres)],
    ["Played", String(playedCount)],
    ["Never played", String(neverPlayedCount)],
    ["Played this month", String(tracksPlayedThisMonth)],
    ["Time this month", formatDuration(timePlayedThisMonthSecs)],
    ["Total time played", formatDuration(totalTimePlayedSecs)],
  ];

  return (
    <div className="stats-footer">
      {stats.map(([label, value]) => (
        <div className="stats-tile" key={label}>
          <span className="stats-tile-value mono">{value}</span>
          <span className="stats-tile-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
