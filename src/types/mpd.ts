import * as M3U8 from "./m3u8";

export interface SegmentMap extends M3U8.SegmentMap {
  resolvedUri: string;
}

export interface Segment extends M3U8.Segment {
  resolvedUri: string;
  map: SegmentMap;
}

export interface Playlist extends M3U8.Playlist {
  resolvedUri: string;
  segments?: Segment[];
}

export interface AudioGroupItem extends M3U8.AudioGroupItem {
  playlists?: Playlist[];
}

export interface MediaGroup extends M3U8.MediaGroup {
  AUDIO: Record<string, Record<string, AudioGroupItem>>;
}

export type Manifest = {
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
  timelineStarts?: M3U8.TimelineStart[];
};
