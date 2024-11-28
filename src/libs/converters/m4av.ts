import path from "node:path";

import BaseConverter from "./base";
import { fetchWithTimeout } from "../network";
import { getFileNameByUrl } from "../file";
import config from "@/config";
import { log } from "@/logging";

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
    } catch {
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
    const outputFilePath = this.outputFilePath;
    const hasOnlyAudio = !!/\.m4a/.exec(filePath);

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
        outputFilePath,
      ],
      {
        onExit: (_, exitCode, signalCode, error) =>
          this.onExit(_, exitCode, signalCode, error, "MP4Box"),
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
