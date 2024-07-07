import * as path from "node:path";

import { Parser } from "m3u8-parser";

import BaseConverter from "./base";
import { clearFileName, getFileNameByUrl } from "../file";
import { fetchWithTimeout } from "../network";
import config from "../../config";
import { log } from "../../logging";
import { Manifest, MediaGroup, Playlist, Segment } from "../../types/m3u8";

export default class M3U8Converter extends BaseConverter {
  // 3-4 times faster than m3u8-to-mp4 (JS | https://github.com/furkaninanc/m3u8-to-mp4)
  // +-performance as multi-threading m3u8_To_MP4 (Python | https://github.com/sounghaohao/m3u8_To_MP4). Sometimes faster, sometimes slower\
  // 8 times faster than default ffmpeg m3u8-mp4
  hasOnlyAudio = false;
  segmentRe = /([^/]+)\.m3u8/;
  fileRe = this.segmentRe;

  ffmpegOnlyAudioOpts =
    `-loop 1 -i ${path.join(config.app.publicPath, "black.png")} -pix_fmt yuv420p -tune stillimage -shortest -crf 0`.split(
      " ",
    );

  getMediaGroup(mediaGroups: MediaGroup) {
    return Object.values(Object.values(mediaGroups.AUDIO)[0])[0];
  }

  getBestPlaylist(playlists: Playlist[]) {
    return playlists.reduce((prev: Playlist, current: Playlist) =>
      prev?.attributes?.BANDWIDTH > current?.attributes?.BANDWIDTH ? prev : current,
    );
  }

  replaceURLFileName(originalURL: string, newFileName: string): string {
    // replace filename in originalURL (if it doesn't contain https)
    if (/http(s)?:\/\//.test(newFileName)) {
      log.debug("skip", originalURL, newFileName);
      return newFileName;
    }

    if (!originalURL) {
      return newFileName;
    }

    const completeUrl = new URL(originalURL);
    const filename = completeUrl.pathname.match(this.fileRe)?.[0];
    if (!filename) {
      log.info(`Unknown filename for ${completeUrl.href}`);
      return "";
    }

    completeUrl.pathname = completeUrl.pathname.replace(filename, newFileName);
    return completeUrl.href;
  }

  async downloadManifest(url: string) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": config.converters.userAgent,
        },
      });

      return await res.text();
    } catch (err: unknown) {
      log.error(`Failed to download manifest: ${url}. Error: ${(err as Error).message}`);
      return "";
    }
  }

  async loadManifest(content: string) {
    const parser = new Parser();
    const manifestText = content.match(/http(s)?:\/\//)
      ? await this.downloadManifest(content)
      : content;
    parser.push(manifestText);
    parser.end();

    const manifest = parser.manifest;
    // filter title for twitch m3u8 modified format
    // we believe that streams have a duration of < 1 sec
    manifest.segments = manifest.segments.filter(
      (segment) => segment.duration >= 1 && segment?.title !== "live",
    );

    return manifest;
  }

  async getManifestWithBestBandwidth(url: string): Promise<Manifest> {
    let parsedManifest = await this.loadManifest(url);
    if (!parsedManifest.playlists?.length && !parsedManifest.mediaGroups?.AUDIO) {
      return parsedManifest;
    }

    // we assume that if there is a separate audio, then there will be no built-in audio in the video
    this.hasOnlyAudio = !!(
      parsedManifest.mediaGroups?.AUDIO && Object.keys(parsedManifest.mediaGroups?.AUDIO).length > 0
    );

    const bestUrl = this.hasOnlyAudio
      ? this.getMediaGroup(parsedManifest.mediaGroups!)
      : this.getBestPlaylist(parsedManifest.playlists!);

    url = this.replaceURLFileName(url, bestUrl.uri);
    parsedManifest = await this.loadManifest(url);
    return parsedManifest;
  }

  async fetchSegments(segments: Segment[]) {
    return Array.from(
      new Set(
        await Promise.all(
          segments
            .filter((segment: Segment) => {
              return !(
                segment.byterange &&
                segment.byterange.offset > 0 &&
                segment.uri === segments[0].uri
              );
            })
            .map(async (segment: Segment) => {
              const segmentUrl = this.replaceURLFileName(this.url, segment.uri);
              try {
                const res = await fetchWithTimeout(segmentUrl);
                segment.content = await res.blob();
              } catch (err) {
                log.debug(`Failed to download segment from ${segmentUrl}`);
                segment.content = new Blob([]);
              }

              if (!segment.content.size) {
                return segment;
              }

              const filename = getFileNameByUrl(segmentUrl);
              const filePath = path.join(this.tempPath, filename);
              await Bun.write(filePath, segment.content);

              return segment;
            }),
        ),
      ),
    );
  }

  async mergeSegments(segments: Segment[]) {
    const mediaUrl = this.url;
    const hasOnlyAudio = this.hasOnlyAudio;

    const segmentListPath = path.join(this.tempPath, "sls.txt");
    let segmentsContent = "";
    for (const segment of segments) {
      if (!segment.content?.size) {
        log.debug({ originalUrl: mediaUrl }, `Segment content not found.`);
        continue;
      }

      const filenameFromUrl = getFileNameByUrl(this.replaceURLFileName(mediaUrl, segment.uri));
      const filePath = path.join(this.tempPath, filenameFromUrl);
      segmentsContent += `file '${filePath}'\n`;
    }

    await Bun.write(segmentListPath, segmentsContent);

    const mp4FileName = path.join(this.outPath, clearFileName(this.filename, ".mp4"));

    // by deleting unnecessary information in the console, performance increases several times (if a lot of errors occur during conversion that do not affect the result. 48s --> 14s)
    const proc = Bun.spawn(
      [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-hide_banner",
        "-loglevel",
        "panic",
        "-safe",
        "0",
        "-i",
        segmentListPath,
        // ...(hasOnlyAudio ? this.ffmpegOnlyAudioOpts : []),
        "-c",
        "copy",
        mp4FileName,
      ],
      {
        onExit(_, exitCode, signalCode, error) {
          if (exitCode !== 0) {
            log.warn(
              {
                path: mp4FileName,
                hasOnlyAudio,
                originalUrl: mediaUrl,
                error,
              },
              `FFmpeg exited with ${exitCode} code (${signalCode})`,
            );
          }
        },
      },
    );
    await proc.exited;
    proc.kill();
    return true;
  }

  async convertToMP4() {
    await this.createOutDir();
    const parsedManifest = await this.getManifestWithBestBandwidth(this.url);

    if (!parsedManifest.segments.length) {
      log.error("At least one segment wasn't found");
      return false;
    }

    parsedManifest.segments = await this.fetchSegments(parsedManifest.segments);
    await this.mergeSegments(parsedManifest.segments);

    return await this.afterConvertCb();
  }
}
