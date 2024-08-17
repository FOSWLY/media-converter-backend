import path from "node:path";

import { log } from "../../logging";

import M4AVConverter from "./m4av";
import M3U8Converter from "./m3u8";
import { parse } from "mpd-parser";
import { Playlist, Segment, AudioGroupItem, MediaGroup } from "../../types/mpd";
import { fetchWithTimeout } from "../network";
import { appendToFileName, getFileNameByUrl } from "../file";

export default class MPDConverter extends M3U8Converter {
  m4avRe = /\.m4(a|v)/;
  segmentRe = /([^/]+)\.m4s/;
  fileRe = /([^/]+)\.(mpd|xml)/;

  async loadManifest(content: string) {
    if (/http(s)?:\/\//.exec(content)) {
      content = await this.downloadManifest(content);
    } else if (!content.startsWith("<?xml")) {
      content = atob(content);
    }

    return parse(content);
  }

  getMediaGroup(mediaGroups: MediaGroup) {
    return Object.values(Object.values(mediaGroups.AUDIO)[0])[0];
  }

  getBestPlaylist(playlists: Playlist[]) {
    return playlists.reduce((prev: Playlist, current: Playlist) =>
      prev?.attributes?.BANDWIDTH > current?.attributes?.BANDWIDTH ? prev : current,
    );
  }

  async fetchSegmentsDownloader(segment: Segment, idx: number, segments: Segment[]) {
    const isPartial =
      segment.uri.includes(".ts") && segment.byterange
        ? !!segments.find(
            (seg) => seg.uri === segment.uri && seg.byterange?.offset === segment.byterange?.offset,
          )
        : false;
    try {
      const res = await fetchWithTimeout(segment.resolvedUri, {
        headers: {
          Range: isPartial
            ? `bytes=${segment.byterange!.offset}-${segment.byterange!.offset + segment.byterange!.length}`
            : "bytes=0-",
        },
      });
      segment.content = await res.blob();
    } catch {
      log.debug(`Failed to download segment from ${segment.resolvedUri}`);
      segment.content = new Blob([]);
    }

    if (!segment.content.size) {
      return segment;
    }

    let filename = getFileNameByUrl(segment.resolvedUri);
    if (isPartial) {
      filename = appendToFileName(filename, `_${idx}`);
      segment.uri = filename;
    }

    segment.filePath = path.join(this.tempPath, filename);
    await Bun.write(segment.filePath, segment.content);

    return segment;
  }

  async fetchSegments(segments: Segment[]) {
    return (await super.fetchSegments(segments)) as Segment[];
  }

  getMPDPlaylist(candidate: AudioGroupItem | Playlist, hasOnlyAudio: boolean) {
    // redefining for normal operation with recursion
    this.hasOnlyAudio = hasOnlyAudio;
    if ((candidate as Playlist)?.resolvedUri) {
      // set actual url path
      this.url = (candidate as Playlist)?.resolvedUri ?? this.extraUrl;
    }

    if (!(candidate as AudioGroupItem)?.playlists) {
      return false;
    }

    return (candidate as AudioGroupItem).playlists![0];
  }

  // @ts-expect-error: TS2416
  async getManifestWithBestBandwidth(content: string) {
    const parsedManifest = await this.loadManifest(content);
    if (!parsedManifest.playlists?.length && !parsedManifest.mediaGroups?.AUDIO) {
      return false;
    }

    // we assume that if there is a separate audio, then there will be no built-in audio in the video
    this.hasOnlyAudio = !!(
      parsedManifest.mediaGroups?.AUDIO && Object.keys(parsedManifest.mediaGroups?.AUDIO).length > 0
    );
    const candidate = this.hasOnlyAudio
      ? this.getMediaGroup(parsedManifest.mediaGroups!)
      : this.getBestPlaylist(parsedManifest.playlists!);

    return this.getMPDPlaylist(candidate, this.hasOnlyAudio);
  }

  getFilesBySegments(segments: Segment[]) {
    const initSegments: string[] = [];
    const files = segments.reduce((arr, segment) => {
      if (!segment.map) {
        arr.push(segment.uri);
        return arr;
      }

      const mapUrl = segment.map.resolvedUri;
      if (!initSegments.includes(mapUrl)) {
        initSegments.push(mapUrl);
        arr.push(segment.map.uri);
      }

      arr.push(segment.uri);
      return arr;
    }, [] as string[]);
    return [initSegments, files];
  }

  async convertToMP4() {
    await this.createOutDir();
    const parsedPlaylist = await this.getManifestWithBestBandwidth(this.url);
    if ((parsedPlaylist as Playlist)?.resolvedUri?.match(this.m4avRe)) {
      const url = this.replaceURLFileName(this.url, (parsedPlaylist as Playlist)?.resolvedUri);
      return await new M4AVConverter(url, this.format).convertToMP4();
    }

    if (!parsedPlaylist || !parsedPlaylist?.segments?.length) {
      log.error("At least one segment wasn't found");
      return false;
    }

    if (!/http(s)?:\/\//.exec(this.url)) {
      this.url = parsedPlaylist?.resolvedUri ?? parsedPlaylist.segments[0]?.resolvedUri ?? this.url;
    }

    parsedPlaylist.segments = await this.fetchSegments(parsedPlaylist.segments);
    await this.concatSegmentsByMap(parsedPlaylist.segments);

    return await this.afterConvertCb();
  }
}
