import { BunFile } from "bun";
import { Elysia } from "elysia";

import { FailedConvertMedia } from "../../errors";
import { getPublicFilePath, getRemoveOnDate } from "../../libs/utils";
import { convertModels } from "../../models/convert.model";
import { mediaFormat } from "../../types/convert";

import BaseConverter from "../../libs/converters/base";
import M4AVConverter from "../../libs/converters/m4av";
import M3U8Converter from "../../libs/converters/m3u8";
import MPDConverter from "../../libs/converters/mpd";
import { log } from "../../logging";

const MAX_TIME_TO_CONVERT = 30_000; // 30 secs

export default new Elysia().group("/convert", (app) =>
  app.use(convertModels).post(
    "/",
    async ({ body: { direction, file } }) => {
      const [_, toFormat] = direction.split("-") as mediaFormat[];
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

      let timedOut = false;
      const convertedFile = (await Promise.race([
        new Promise((resolve) => resolve(new converter(file, toFormat).convert())),
        new Promise((resolve) =>
          setTimeout(() => {
            timedOut = true;
            resolve(null);
          }, MAX_TIME_TO_CONVERT),
        ),
      ])) as BunFile | null;
      if (!convertedFile || !(await convertedFile.exists())) {
        log[timedOut ? "warn" : "debug"](
          { file, direction },
          timedOut
            ? `Convert timed out after ${MAX_TIME_TO_CONVERT} ms`
            : "Failed to convert media",
        );
        throw new FailedConvertMedia();
      }

      return {
        url: getPublicFilePath(convertedFile),
        removeOn: getRemoveOnDate(),
      };
    },
    {
      body: "convert",
      detail: {
        summary: "Convert video url to media file",
        tags: ["Convert"],
      },
    },
  ),
);
