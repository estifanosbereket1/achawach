import {
  ChurchIcon,
  ConfettiIcon,
  DiscIcon,
  FilmSlateIcon,
  GuitarIcon,
  HeadphonesIcon,
  MicrophoneStageIcon,
  MusicNoteIcon,
  MusicNotesSimpleIcon,
  PianoKeysIcon,
  VinylRecordIcon,
} from "@phosphor-icons/react";

type IconComponent = typeof MusicNoteIcon;

const GENRE_ICON_RULES: [RegExp, IconComponent][] = [
  [/hip.?hop|rap/i, MicrophoneStageIcon],
  [/r&?b|rnb|soul/i, MicrophoneStageIcon],
  [/classical/i, PianoKeysIcon],
  [/jazz/i, PianoKeysIcon],
  [/rock|metal|blues/i, GuitarIcon],
  [/country|folk/i, MusicNotesSimpleIcon],
  [/electronic|edm|dance|techno|house|trance/i, DiscIcon],
  [/reggae/i, VinylRecordIcon],
  [/gospel|worship|christian/i, ChurchIcon],
  [/soundtrack|score|film/i, FilmSlateIcon],
  [/podcast|audiobook|spoken/i, HeadphonesIcon],
  [/party|pop/i, ConfettiIcon],
];

export function getGenreIcon(genre: string): IconComponent {
  for (const [pattern, icon] of GENRE_ICON_RULES) {
    if (pattern.test(genre)) return icon;
  }
  return MusicNoteIcon;
}
