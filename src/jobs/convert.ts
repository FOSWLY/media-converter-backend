import { BunFile } from "bun";
import { Job } from "bullmq";

import { log } from "../logging";
import { ConvertJobOpts } from "../types/convert";
import ConvertFacade from "../facades/convert";
import { FailedConvertMedia } from "../errors";

import BaseConverter from "../libs/converters/base";
import M4AVConverter from "../libs/converters/m4av";
import M3U8Converter from "../libs/converters/m3u8";
import MPDConverter from "../libs/converters/mpd";
import { asyncWithTimelimit, getPublicFilePath } from "../libs/utils";

export default abstract class ConverterJob {
  static MAX_TIME_TO_CONVERT = 300_000; // 5 min

  static async processor(job: Job<ConvertJobOpts>) {
    const { hasOldConvert, direction, file, file_hash } = job.data;
    const getBy = {
      direction,
      file_hash,
    };

    const convertFacade = new ConvertFacade();
    if (hasOldConvert) {
      await convertFacade.delete(getBy);
    }

    await convertFacade.create({ ...getBy, status: "waiting" });

    const toFormat = direction.split("-")[1];
    let converter = BaseConverter;
    switch (direction) {
      case "m3u8-mp4":
        converter = M3U8Converter;
        break;
      case "m4a-mp4":
      case "m4v-mp4":
        converter = M4AVConverter;
        break;
      case "mpd-mp4":
        converter = MPDConverter;
        break;
    }

    const convertedFile = (await asyncWithTimelimit(
      ConverterJob.MAX_TIME_TO_CONVERT,
      new converter(file, toFormat).convert(),
      null,
    )) as BunFile | null;
    if (!convertedFile || !(await convertedFile.exists())) {
      throw new FailedConvertMedia();
    }

    await convertFacade.update(getBy, {
      status: "success",
      message: "",
      download_url: getPublicFilePath(convertedFile),
    });
  }

  static async onFailed(job: Job<ConvertJobOpts> | undefined, error: Error) {
    const message = error.message;
    log.error(`${job?.id} has failed with ${message}`);
    if (!job) {
      return;
    }

    const { direction, file_hash } = job.data;
    await new ConvertFacade().update(
      { direction, file_hash },
      {
        status: "failed",
        message,
      },
    );
  }

  static onCompleted(job: Job) {
    log.debug(`Job ${job.id} has completed!`);
  }
}
