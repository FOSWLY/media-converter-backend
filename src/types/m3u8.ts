interface Segment {
  duration: number;
  uri: string;
  timeline: number;
  resolvedUri?: string;
  byterange?: {
    length: number;
    offset: number;
  };
  content?: Blob; // custom
}

interface PlaylistAttribute {
  NAME?: string;
  AUDIO: string;
  SUBTITLES?: "subs";
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
  endList?: boolean;
  timeline: number;
  resolvedUri?: string;
  discontinuityStarts?: number[];
  timelineStarts?: TimelineStart[];
  mediaSequence?: number;
  discontinuitySequence?: number;
  segments?: Segment[];
}

interface AudioGroupItem {
  language?: string;
  default: boolean;
  autoselect: boolean;
  playlists?: Playlist[];
  uri: string;
}

interface MediaGroup {
  AUDIO: Record<string, Record<string, AudioGroupItem>>;
  VIDEO: object;
  "CLOSED-CAPTIONS": object;
  SUBTITLES: object;
}

type TimelineStart = { start: number; timeline: number };

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
  uri?: string;
  duration?: number;
  mediaGroups?: MediaGroup;
  playlists?: Playlist[];
  timelineStarts?: TimelineStart[];
}
