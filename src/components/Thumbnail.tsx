import { Music } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";

interface ThumbnailProps {
  artworkPath: string | null;
  size?: number;
  alt?: string;
}

export function Thumbnail({ artworkPath, size = 36, alt = "" }: ThumbnailProps) {
  const style = { width: size, height: size };

  if (!artworkPath) {
    return (
      <div className="thumbnail thumbnail-fallback" style={style}>
        <Music size={Math.round(size * 0.5)} />
      </div>
    );
  }

  return <img className="thumbnail" style={style} src={convertFileSrc(artworkPath)} alt={alt} />;
}
