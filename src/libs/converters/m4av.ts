import * as path from "node:path";

import BaseConverter from "./base";
import { fetchWithTimeout } from "../network";
import { clearFileName, getFileNameByUrl } from "../file";
import config from "../../config";
import { log } from "../../logging";

export default class M4AVConverter extends BaseConverter {
  async fetchM4av(url: string): Promise<[Blob, string]> {
    let file = new Blob([]);
    try {
      const res = await fetchWithTimeout(url, {
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
    const filePath = path.join(this.tempPath, filename);
    await Bun.write(filePath, file);
    return [file, filePath];
  }

  async convertToMP4Impl(filePath: string) {
    const mp4FileName = path.join(this.outPath, clearFileName(this.filename, ".mp4"));
    const hasOnlyAudio = !!filePath.match(/\.m4a/);

    const proc = Bun.spawn(
      [
        "mp4box",
        "-add",
        filePath,
        ...(hasOnlyAudio ? ["-add", this.blackImg] : []),
        // if don't add meta, ffmpeg will give an error about missing headers
        "-patch",
        this.mediaMeta,
        "-quiet",
        "-new",
        mp4FileName,
      ],
      {
        onExit(_, exitCode, signalCode, error) {
          if (exitCode !== 0) {
            log.warn(
              { path: mp4FileName, hasOnlyAudio, error },
              `MP4Box exited with ${exitCode} code (${signalCode})`,
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
    const [file, filePath] = await this.fetchM4av(this.url);
    if (!file.size) {
      return false;
    }

    await this.convertToMP4Impl(filePath);

    return await this.afterConvertCb();
  }
}
