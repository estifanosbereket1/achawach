import {
  Church,
  Disc2,
  Disc3,
  Film,
  Guitar,
  Headphones,
  MicVocal,
  Music,
  Music3,
  PartyPopper,
  Piano,
} from "lucide-react";

type IconComponent = typeof Music;

const GENRE_ICON_RULES: [RegExp, IconComponent][] = [
  [/hip.?hop|rap/i, MicVocal],
  [/r&?b|rnb|soul/i, MicVocal],
  [/classical/i, Piano],
  [/jazz/i, Piano],
  [/rock|metal|blues/i, Guitar],
  [/country|folk/i, Music3],
  [/electronic|edm|dance|techno|house|trance/i, Disc3],
  [/reggae/i, Disc2],
  [/gospel|worship|christian/i, Church],
  [/soundtrack|score|film/i, Film],
  [/podcast|audiobook|spoken/i, Headphones],
  [/party|pop/i, PartyPopper],
];

export function getGenreIcon(genre: string): IconComponent {
  for (const [pattern, icon] of GENRE_ICON_RULES) {
    if (pattern.test(genre)) return icon;
  }
  return Music;
}
