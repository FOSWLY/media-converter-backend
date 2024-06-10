import * as path from "node:path";

import { afterConvertCb, defaultOutPath, defaultTempPath, getOpts } from "../utils";
import { clearFileName, getFileNameByUrl } from "../../file";
import { log } from "../../../setup";
import config from "../../../config";

type FetchM4avOpts = {
  tempPath?: string;
};

type convertM4avToMP4InternalOpts = {
  outPath?: string;
  filename?: string;
};

async function fetchM4av(
  url: string,
  { tempPath = defaultTempPath }: FetchM4avOpts = {},
): Promise<[Blob, string]> {
  let file = new Blob([]);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": config.converters.userAgent,
      },
    });
    file = await res.blob();
  } catch (err) {
    log.debug(`Failed to download m4av from ${url}`);
  }

  if (!file.size) {
    return [file, ""];
  }

  const filename = getFileNameByUrl(url);
  const filePath = path.join(tempPath, filename);
  await Bun.write(filePath, file);
  return [file, filePath];
}

async function convertM4avToMP4Internal(
  filePath: string,
  { outPath = defaultOutPath, filename = "out.mp4" }: convertM4avToMP4InternalOpts = {},
) {
  const mp4FileName = path.join(outPath, clearFileName(filename, ".mp4"));
  const hasOnlyAudio = !!filePath.match(/\.m4a/);

  const proc = Bun.spawn(
    [
      "mp4box",
      "-add",
      filePath,
      ...(hasOnlyAudio ? ["-add", path.join(config.app.publicPath, "black.png")] : []),
      "-mpeg4",
      "-quiet",
      "-new",
      mp4FileName,
    ],
    {
      onExit(_, exitCode, signalCode, error) {
        if (exitCode !== 0) {
          log.warn(
            `MP4Box exited with ${exitCode} code (${signalCode}). Error: ${error}. Detail: path - ${mp4FileName}, hasOnlyAudio: ${hasOnlyAudio}`,
          );
        }
      },
    },
  );
  await proc.exited;
  proc.kill();
  return true;
}

export default async function convertM4avToMP4(url: string) {
  const { filename, outPath, tempPath } = await getOpts("mp4");

  const [file, filePath] = await fetchM4av(url, { tempPath });
  if (!file.size) {
    return false;
  }

  await convertM4avToMP4Internal(filePath, {
    outPath,
    filename,
  });

  return await afterConvertCb(tempPath, outPath, filename);
}

export { convertM4avToMP4Internal, fetchM4av };
