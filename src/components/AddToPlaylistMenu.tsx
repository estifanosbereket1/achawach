import { useState } from "react";
import { ListPlusIcon, PlusIcon } from "@phosphor-icons/react";
import type { PlaylistActions, Track } from "../types";
import { Dropdown } from "./Dropdown";

interface AddToPlaylistMenuProps extends PlaylistActions {
  track: Track;
  direction?: "down" | "up";
}

export function AddToPlaylistMenu({
  track,
  playlists,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
  direction = "down",
}: AddToPlaylistMenuProps) {
  const [newName, setNewName] = useState("");

  return (
    <Dropdown
      align="right"
      direction={direction}
      trigger={
        <button className="icon-button" aria-label="Add to playlist" title="Add to playlist">
          <ListPlusIcon size={16} />
        </button>
      }
    >
      {(close) => (
        <>
          {playlists.length === 0 ? (
            <div className="dropdown-empty">No playlists yet</div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                className="dropdown-item"
                onClick={() => {
                  onAddToPlaylist(playlist.id, track);
                  close();
                }}
              >
                {playlist.name}
              </button>
            ))
          )}
          <div className="dropdown-divider" />
          <div className="dropdown-new-playlist">
            <input
              className="dropdown-input"
              type="text"
              placeholder="New playlist…"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  onCreatePlaylistWithTrack(newName.trim(), track);
                  setNewName("");
                  close();
                }
              }}
            />
            <button
              className="icon-button"
              disabled={!newName.trim()}
              onClick={() => {
                if (!newName.trim()) return;
                onCreatePlaylistWithTrack(newName.trim(), track);
                setNewName("");
                close();
              }}
              aria-label="Create playlist"
            >
              <PlusIcon size={14} />
            </button>
          </div>
        </>
      )}
    </Dropdown>
  );
}
