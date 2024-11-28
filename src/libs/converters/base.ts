import { ErrorLike, SpawnOptions, Subprocess } from "bun";

import path from "node:path";
import { mkdir, rmdir, exists } from "node:fs/promises";

import config from "@/config";
import { log } from "@/logging";
import { MediaFormat } from "@/types/convert";
import { getCurrentDate, getUid } from "../utils";
import { clearFileName } from "../file";

const defaultTempPath = path.join(__dirname, "temp");

export default class BaseConverter {
  blackImg: string = path.join(config.app.publicPath, "black.png");
  mediaMeta: string = path.join(config.app.publicPath, "meta.xml");

  tempPath: string;
  outPath: string;
  outputFilePath: string;

  url: string;
  extraUrl: string;
  filename: string;
  format: MediaFormat;

  constructor(url: string, format: MediaFormat = "mp4", extraUrl: string | null = null) {
    this.url = url;
    this.extraUrl = extraUrl ?? url;
    this.format = format;

    const fileUUID = getUid();
    this.filename = `${fileUUID}.${format}`;

    const currentDate = getCurrentDate(true);
    this.tempPath = path.join(defaultTempPath, currentDate, fileUUID);
    this.outPath = path.join(config.app.publicPath, "media", format, currentDate);
    this.outputFilePath = path.join(this.outPath, clearFileName(this.filename, `.${format}`));
  }

  onExit(
    _: Subprocess<SpawnOptions.Writable, SpawnOptions.Readable, SpawnOptions.Readable>,
    exitCode: number | null,
    signalCode: number | null,
    error: ErrorLike | undefined,
    converter = "Converter",
  ) {
    if (exitCode !== 0) {
      log.warn(
        {
          path: this.outputFilePath,
          originalUrl: this.url,
          error,
        },
        `${converter} exited with ${exitCode} code (${signalCode})`,
      );
    }
  }

  // async convertWithYTdlp(url: string) {
  //   // ! don't use:
  //   // * -P instead of -o just to set a custom folder for temporary files (it's 4 times slower!)
  //   // * --force-overwrites (1.75 times slower, but the probability of colic is too low to sacrifice speed so much)
  //   log.debug("Start converting with yt-dlp");
  //   const proc = Bun.spawn(
  //     [
  //       "yt-dlp",
  //       "-o",
  //       this.outputFilePath,
  //       "--external-downloader",
  //       "aria2c",
  //       "--external-downloader-args",
  //       "aria2c:-x 16 -k 1M",
  //       url,
  //       "--quiet",
  //       "--no-warnings",
  //     ],
  //     {
  //       onExit: (_, exitCode, signalCode, error) =>
  //         this.onExit(_, exitCode, signalCode, error, "yt-dlp"),
  //     },
  //   );
  //   log.debug("await finish converting with yt-dlp");
  //   await proc.exited;
  //   log.debug("converting with yt-dlp finished");
  //   proc.kill();

  //   return true;
  // }

  async createOutDir() {
    if (!(await exists(this.outPath))) {
      log.debug(`Folder has been created for the output: ${this.outPath}`);
      await mkdir(this.outPath, { recursive: true });
    }

    // additional check, without this some times we get an error "No such file or directory"
    if (!(await exists(this.tempPath))) {
      await mkdir(this.tempPath, { recursive: true });
    }

    return this;
  }

  async afterConvertCb() {
    if (await exists(this.tempPath)) {
      await rmdir(this.tempPath, { recursive: true });
    }

    return Bun.file(path.join(this.outPath, this.filename));
  }

  async convertToMP4(): Promise<any> {
    throw new Error("Not implemented");
  }

  async convert(): Promise<any> {
    switch (this.format) {
      case "mp4":
        return await this.convertToMP4();
      default:
        throw new Error("Not implemented");
    }
  }
}
