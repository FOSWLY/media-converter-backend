interface Segment {
  duration: number;
  uri: string;
  timeline: number;
  byterange?: {
    length: number;
    offset: number;
  };
  content?: Blob; // custom
}

interface PlaylistAttribute {
  AUDIO: string;
  CODECS: string;
  "FRAME-RATE": number;
  RESOLUTION: {
    width: number;
    height: number;
  };
  "AVERAGE-BANDWIDTH": string;
  BANDWIDTH: number;
  "CLOSED-CAPTIONS": string;
  "PROGRAM-ID": number;
}

interface Playlist {
  attributes: PlaylistAttribute;
  uri: string;
  timeline: number;
}

interface AudioGroupItem {
  default: boolean;
  autoselect: boolean;
  uri: string;
}

interface MediaGroup {
  AUDIO: Record<string, Record<string, AudioGroupItem>>;
  VIDEO: object;
  "CLOSED-CAPTIONS": object;
  SUBTITLES: object;
}

interface Manifest {
  allowCache: boolean;
  discontinuityStarts: number[];
  dateRanges: unknown[]; // ?
  segments: Segment[];
  version?: number;
  targetDuration?: number;
  playlistType?: string;
  mediaSequence?: number;
  discontinuitySequence?: number;
  endList?: boolean;
  mediaGroups?: MediaGroup;
  playlists?: Playlist[];
}
