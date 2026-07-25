import type { PlaylistActions, Track } from "../types";
import { TrackRows } from "./TrackRows";
import { SectionHeader } from "./SectionHeader";
import { shuffleArray } from "../utils";

interface TrackSectionPageProps extends PlaylistActions {
  title: string;
  tracks: Track[];
  currentTrackId: string | null;
  onBack: () => void;
  onPlayList: (list: Track[], index: number) => void;
}

export function TrackSectionPage({
  title,
  tracks,
  currentTrackId,
  onBack,
  onPlayList,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
}: TrackSectionPageProps) {
  return (
    <div className="tab-panel">
      <SectionHeader
        title={title}
        mode="full"
        onNavigate={onBack}
        onPlay={() => onPlayList(tracks, 0)}
        onShufflePlay={() => onPlayList(shuffleArray(tracks), 0)}
        disabled={tracks.length === 0}
      />
      {tracks.length === 0 ? (
        <p className="track-list-empty">Nothing here yet.</p>
      ) : (
        <TrackRows
          tracks={tracks}
          currentTrackId={currentTrackId}
          onPlayList={onPlayList}
          playlists={playlists}
          onAddToPlaylist={onAddToPlaylist}
          onCreatePlaylistWithTrack={onCreatePlaylistWithTrack}
        />
      )}
    </div>
  );
}
