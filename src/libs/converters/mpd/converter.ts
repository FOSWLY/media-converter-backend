import * as path from "node:path";

import { log } from "../../../setup";

import { getManifestWithBestBandwidth, m4sRe } from "./parser";
import {
  afterConvertCb,
  defaultOutPath,
  defaultTempPath,
  ffmpegOnlyAudioOpts,
  getOpts,
} from "../utils";
import { clearFileName, getFileNameByUrl } from "../../file";
import { replaceURLFileName } from "../m3u8-mpd-shared";
import { convertM4avToMP4Internal, fetchM4av } from "../m4av/converter";
import { fetchWithTimeout } from "../../network";

type MergeSegmentsOpts = {
  tempPath?: string;
  outPath?: string;
  filename?: string;
  originalUrl?: string;
  hasOnlyAudio?: boolean;
};

type FetchSegmentsOpts = {
  tempPath?: string;
  originalUrl?: string;
};

async function fetchSegments(
  segments: Segment[],
  { tempPath = defaultTempPath, originalUrl = "" }: FetchSegmentsOpts = {},
) {
  return Array.from(
    new Set(
      await Promise.all(
        segments
          .filter((segment: Segment) => {
            return !(segment.uri === segments[0].uri);
          })
          .map(async (segment: Segment) => {
            const segmentUrl = replaceURLFileName(originalUrl, segment.uri, m4sRe);
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
    originalUrl = "",
    hasOnlyAudio = false,
  }: MergeSegmentsOpts = {},
) {
  const segmentListPath = path.join(tempPath, "m4s_ls.txt");
  let segmentsContent = "";
  for (const segment of segments) {
    if (!segment.content || !segment.content.size) {
      log.debug(`Segment content not found. Original MPD: ${originalUrl}`);
      continue;
    }

    const filenameFromUrl = getFileNameByUrl(replaceURLFileName(originalUrl, segment.uri, m4sRe));
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
            `FFmpeg exited with ${exitCode} code (${signalCode}). Error: ${error}. Detail: path - ${mp4FileName}, hasOnlyAudio: ${hasOnlyAudio}, originalUrl: ${originalUrl}`,
          );
        }
      },
    },
  );
  await proc.exited;
  proc.kill();
  return true;
}

export default async function convertMPDtoMP4(url: string) {
  const { filename, outPath, tempPath } = await getOpts("mp4");

  let [parsedManifest, hasOnlyAudio] = await getManifestWithBestBandwidth(url, url);
  if (typeof parsedManifest === "string") {
    const [file, filePath] = await fetchM4av(parsedManifest, { tempPath });
    if (!file.size) {
      return false;
    }

    await convertM4avToMP4Internal(filePath, {
      outPath,
      filename,
    });

    return await afterConvertCb(tempPath, outPath, filename);
  }

  if (!(parsedManifest as Manifest).segments.length) {
    log.error("At least one segment wasn't found");
    return false;
  }

  parsedManifest.segments = await fetchSegments(parsedManifest.segments as Segment[], {
    originalUrl: url,
    tempPath,
  });

  await mergeSegments(parsedManifest.segments, {
    originalUrl: url,
    outPath,
    filename,
    tempPath,
    hasOnlyAudio,
  });

  return await afterConvertCb(tempPath, outPath, filename);
}
