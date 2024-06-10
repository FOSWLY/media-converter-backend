import * as path from "node:path";

import { log } from "../../../setup";

import { m3u8Re, getManifestWithBestBandwidth } from "./parser";
import { clearFileName, getFileNameByUrl } from "../../file";
import { fetchWithTimeout } from "../../network";
import {
  afterConvertCb,
  defaultOutPath,
  defaultTempPath,
  ffmpegOnlyAudioOpts,
  getOpts,
} from "../utils";
import { replaceURLFileName } from "../m3u8-mpd-shared";

interface MergeSegmentsOpts {
  tempPath?: string;
  outPath?: string;
  filename?: string;
  originalM3U8Url?: string;
  hasOnlyAudio?: boolean;
}

interface FetchSegmentsOpts {
  tempPath?: string;
  originalUrl?: string;
}

async function fetchSegments(
  segments: Segment[],
  { tempPath = defaultTempPath, originalUrl = "" }: FetchSegmentsOpts = {},
) {
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
            const segmentUrl = replaceURLFileName(originalUrl, segment.uri, m3u8Re);
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
            const filePath = path.join(tempPath, filename);
            await Bun.write(filePath, segment.content);

            return segment;
          }),
      ),
    ),
  );
}

async function mergeSegments(
  segments: Segment[],
  {
    tempPath = defaultTempPath,
    outPath = defaultOutPath,
    filename = "out.mp4",
    originalM3U8Url = "",
    hasOnlyAudio = false,
  }: MergeSegmentsOpts = {},
) {
  const segmentListPath = path.join(tempPath, "ts_ls.txt");
  let segmentsContent = "";
  for (const segment of segments) {
    if (!segment.content || !segment.content.size) {
      log.debug(`Segment content not found. Original M3U8: ${originalM3U8Url}`);
      continue;
    }

    const filenameFromUrl = getFileNameByUrl(
      replaceURLFileName(originalM3U8Url, segment.uri, m3u8Re),
    );
    const filePath = path.join(tempPath, filenameFromUrl);
    segmentsContent += `file '${filePath}'\n`;
  }

  await Bun.write(segmentListPath, segmentsContent);

  const mp4FileName = path.join(outPath, clearFileName(filename, ".mp4"));

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
      ...(hasOnlyAudio ? ffmpegOnlyAudioOpts : []),
      "-c",
      "copy",
      mp4FileName,
    ],
    {
      onExit(_, exitCode, signalCode, error) {
        if (exitCode !== 0) {
          log.warn(
            `FFmpeg exited with ${exitCode} code (${signalCode}). Error: ${error}. Detail: path - ${mp4FileName}, hasOnlyAudio: ${hasOnlyAudio}, originalM3U8Url: ${originalM3U8Url}`,
          );
        }
      },
    },
  );
  await proc.exited;
  proc.kill();
  return true;
}

export default async function convertM3U8toMP4(url: string) {
  // 3-4 times faster than m3u8-to-mp4 (JS | https://github.com/furkaninanc/m3u8-to-mp4)
  // +-performance as multi-threading m3u8_To_MP4 (Python | https://github.com/sounghaohao/m3u8_To_MP4). Sometimes faster, sometimes slower
  const { filename, outPath, tempPath } = await getOpts("mp4");

  let [parsedManifest, hasOnlyAudio] = await getManifestWithBestBandwidth(url);

  if (!parsedManifest.segments.length) {
    log.error("At least one segment wasn't found");
    return false;
  }

  parsedManifest.segments = await fetchSegments(parsedManifest.segments, {
    originalUrl: url,
    tempPath,
  });

  await mergeSegments(parsedManifest.segments, {
    originalM3U8Url: url,
    outPath,
    filename,
    tempPath,
    hasOnlyAudio,
  });

  return await afterConvertCb(tempPath, outPath, filename);
}
