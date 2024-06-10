import { log } from "../../setup";

import M4AVConverter from "./m4av";
import M3U8Converter from "./m3u8";
import { parse } from "mpd-parser";

export default class MPDConverter extends M3U8Converter {
  m4avRe = /\.m4(a|v)/;
  segmentRe = /\.m4s/;
  fileRe = /([^/]+)\.(mpd|xml)/;

  async loadManifest(content: string) {
    const manifestText = !content.startsWith("<?xml")
      ? await this.downloadManifest(content)
      : content;

    const manifest = parse(manifestText);
    // filter title for twitch m3u8 modified format
    // we believe that streams have a duration of < 1 sec
    manifest.segments = manifest.segments.filter(
      (segment) => segment.duration >= 1 && (segment as any)?.title !== "live",
    );

    return manifest;
  }

  getBestMPDFile(
    candidate: AudioGroupItem | Playlist,
    hasOnlyAudio: boolean,
  ): string | false | undefined {
    // redefining for normal operation with recursion
    this.hasOnlyAudio = hasOnlyAudio;
    if (candidate.uri) {
      return candidate.uri;
    }

    if (!hasOnlyAudio && (candidate as Playlist)?.resolvedUri?.match(this.m4avRe)) {
      return (candidate as Playlist)?.resolvedUri;
    }

    if (!(candidate as AudioGroupItem)?.playlists) {
      return false;
    }

    const playlist = this.getBestPlaylist((candidate as AudioGroupItem).playlists as Playlist[]);
    return this.getBestMPDFile(playlist, false);
  }

  // @ts-ignore: TS2416
  async getManifestWithBestBandwidth(
    content: string,
    templateUrl: string = "",
  ): Promise<Manifest | string> {
    let parsedManifest = await this.loadManifest(content);
    if (!parsedManifest.playlists?.length && !parsedManifest.mediaGroups?.AUDIO) {
      return parsedManifest;
    }

    // we assume that if there is a separate audio, then there will be no built-in audio in the video
    this.hasOnlyAudio = !!(
      parsedManifest.mediaGroups?.AUDIO && Object.keys(parsedManifest.mediaGroups?.AUDIO).length > 0
    );

    const candidate = this.hasOnlyAudio
      ? this.getMediaGroup(parsedManifest.mediaGroups as MediaGroup)
      : this.getBestPlaylist(parsedManifest.playlists as Playlist[]);

    const bestUrl = this.getBestMPDFile(candidate, this.hasOnlyAudio);
    if (!bestUrl) {
      return parsedManifest;
    }

    const url = this.replaceURLFileName(templateUrl, bestUrl);
    if (url.match(this.m4avRe)) {
      return url;
    }

    parsedManifest = await this.loadManifest(url);
    return parsedManifest;
  }

  async convertToMP4() {
    let parsedManifest = await this.getManifestWithBestBandwidth(this.url, this.url);
    if (typeof parsedManifest === "string") {
      return await new M4AVConverter(parsedManifest, this.format).convertToMP4();
    }

    if (!(parsedManifest as Manifest).segments.length) {
      log.error("At least one segment wasn't found");
      return false;
    }

    parsedManifest.segments = await this.fetchSegments(parsedManifest.segments as Segment[]);
    await this.mergeSegments(parsedManifest.segments);

    return await this.afterConvertCb();
  }
}
