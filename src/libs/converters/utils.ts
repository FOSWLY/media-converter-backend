import * as path from "node:path";

import { mkdir, rmdir, exists } from "node:fs/promises";

import config from "../../config";
import { getUid } from "../utils";
import { log } from "../../setup";

const defaultTempPath = path.join(__dirname, "temp");
const defaultOutPath = path.join(__dirname, "out");
const ffmpegOnlyAudioOpts =
  `-loop 1 -i ${path.join(config.app.publicPath, "black.png")} -pix_fmt yuv420p -tune stillimage -shortest -crf 0`.split(
    " ",
  );

async function getOpts(format = "mp4") {
  const fileUUID = getUid();
  const filename = `${fileUUID}.${format}`;
  const currentDate = new Date().toLocaleDateString().replaceAll(".", "-").replaceAll("/", "-");

  const outPath = path.join(config.app.publicPath, "media", format, currentDate);

  const tempPath = path.join(defaultTempPath, currentDate, fileUUID);
  if (!(await exists(outPath))) {
    log.debug(`Folder has been created for the output: ${outPath}`);
    await mkdir(outPath, { recursive: true });
  }

  return {
    fileUUID,
    filename,
    currentDate,
    outPath,
    tempPath,
  };
}

async function afterConvertCb(tempPath: string, outPath: string, filename: string) {
  if (await exists(tempPath)) {
    await rmdir(tempPath, { recursive: true });
  }

  return Bun.file(path.join(outPath, filename));
}

export { defaultTempPath, defaultOutPath, ffmpegOnlyAudioOpts, getOpts, afterConvertCb };
