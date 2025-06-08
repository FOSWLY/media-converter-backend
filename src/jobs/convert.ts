import { Job } from "bullmq";
import { BunFile } from "bun";

import BaseConverter from "@/libs/converters/base";
import M3U8Converter from "@/libs/converters/m3u8";
import M4AVConverter from "@/libs/converters/m4av";
import MPDConverter from "@/libs/converters/mpd";

import { FailedConvertMedia } from "@/errors";
import { convertFacade } from "@/facades/convert";
import { asyncWithTimelimit, getPublicFilePath } from "@/libs/utils";
import { log } from "@/logging";
import { ConvertJobOpts, MediaFormat } from "@/types/convert";

export default abstract class ConverterJob {
  static MAX_TIME_TO_CONVERT = 300_000; // 5 min

  static async processor(job: Job<ConvertJobOpts>) {
    const { direction, file, file_hash, extra_url } = job.data;
    const getBy = {
      direction,
      file_hash,
    };

    await convertFacade.create({ ...getBy, status: "waiting" });

    const [fromFormat, toFormat] = direction.split("-") as [
      MediaFormat,
      MediaFormat,
    ];
    if (!/^http(s)?:\/\//.exec(file) && fromFormat !== "mpd") {
      // only mpd can convert raw data
      throw new FailedConvertMedia();
    }

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

    const convertedFile = await asyncWithTimelimit<BunFile | null>(
      ConverterJob.MAX_TIME_TO_CONVERT,
      new converter(file, toFormat, extra_url).convert(),
      null,
    );
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
    await convertFacade.update(
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
