/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable @typescript-eslint/require-await */
import * as path from "node:path";
import { mkdir, rmdir, exists } from "node:fs/promises";

import config from "../../config";
import { getUid } from "../utils";
import { log } from "../../logging";
import { mediaFormat } from "../../types/convert";
import { clearFileName } from "../file";

const defaultTempPath = path.join(__dirname, "temp");

export default class BaseConverter {
  blackImg: string = path.join(config.app.publicPath, "black.png");
  mediaMeta: string = path.join(config.app.publicPath, "meta.xml");

  tempPath: string;
  outPath: string;
  outputFilePath: string;

  url: string;
  filename: string;
  format: mediaFormat;

  constructor(url: string, format: mediaFormat = "mp4") {
    this.url = url;
    this.format = format;

    const fileUUID = getUid();
    this.filename = `${fileUUID}.${format}`;

    const currentDate = new Date().toLocaleDateString().replaceAll(".", "-").replaceAll("/", "-");
    this.tempPath = path.join(defaultTempPath, currentDate, fileUUID);
    this.outPath = path.join(config.app.publicPath, "media", format, currentDate);
    this.outputFilePath = path.join(this.outPath, clearFileName(this.filename, `.${format}`));
  }

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
