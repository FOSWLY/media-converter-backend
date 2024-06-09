import * as path from "node:path";

import { mkdir, rmdir, exists } from "node:fs/promises";

import config from "../../../config";
import { log } from "../../../setup";

import { getManifestWithBestBandwidth, replaceURLFileName } from "./parser";
import { clearFileName, getFileNameByUrl } from "../../file";
import { fetchWithTimeout } from "../../network";
import { getUid } from "../../utils";

interface MergeSegmentsOpts {
  tempPath?: string;
  outPath?: string;
  filename?: string;
  originalM3U8Url?: string;
  hasOnlyAudio?: boolean;
}

interface FetchSegmentsOpts {
  tempPath?: string;
  originalM3U8Url?: string;
}

const defaultTempPath = path.join(__dirname, "temp");

async function fetchSegments(
  segments: Segment[],
  { tempPath = defaultTempPath, originalM3U8Url = "" }: FetchSegmentsOpts = {},
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
            const segmentUrl = replaceURLFileName(originalM3U8Url, segment.uri);
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
    outPath = path.join(__dirname, "out"),
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

    const filenameFromUrl = getFileNameByUrl(replaceURLFileName(originalM3U8Url, segment.uri));
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
      ...(hasOnlyAudio
        ? [
            "-loop",
            "1",
            "-i",
            path.join(config.app.publicPath, "black.png"),
            "-pix_fmt",
            "yuv420p",
            "-tune",
            "stillimage",
            "-shortest",
            "-crf",
            "0",
          ]
        : []),
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

export default async function convertM3U8toMP4(M3U8Url: string) {
  // 3-4 times faster than m3u8-to-mp4 (JS | https://github.com/furkaninanc/m3u8-to-mp4)
  // +-performance as multi-threading m3u8_To_MP4 (Python | https://github.com/sounghaohao/m3u8_To_MP4). Sometimes faster, sometimes slower

  const fileUUID = getUid();
  const filename = `${fileUUID}.mp4`;
  const currentDate = new Date().toLocaleDateString().replaceAll(".", "-").replaceAll("/", "-");

  const outPath = path.join(config.app.publicPath, "media", "mp4", currentDate);

  const tempPath = path.join(defaultTempPath, currentDate, fileUUID);
  if (!(await exists(outPath))) {
    log.debug(`Folder has been created for the output: ${outPath}`);
    await mkdir(outPath, { recursive: true });
  }

  let [parsedManifest, hasOnlyAudio] = await getManifestWithBestBandwidth(M3U8Url);

  if (!parsedManifest.segments.length) {
    log.error("At least one segment wasn't found");
    return false;
  }

  parsedManifest.segments = await fetchSegments(parsedManifest.segments, {
    originalM3U8Url: M3U8Url,
    tempPath,
  });

  await mergeSegments(parsedManifest.segments, {
    originalM3U8Url: M3U8Url,
    outPath,
    filename,
    tempPath,
    hasOnlyAudio,
  });

  if (await exists(tempPath)) {
    await rmdir(tempPath, { recursive: true });
  }

  return Bun.file(path.join(outPath, filename));
}
