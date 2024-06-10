import { Elysia, t } from "elysia";
import { BunFile } from "bun";

import { FailedConvertMedia } from "../../errors";
import { getPublicFilePath, getRemoveOnDate } from "../../libs/utils";
import { ConvertBody } from "../../models/convert";

import convertM3U8toMP4 from "../../libs/converters/m3u8/converter";
import convertM4AVToMP4 from "../../libs/converters/m4av/converter";
import convertMPDtoMP4 from "../../libs/converters/mpd/converter";

export default new Elysia().group("/convert", (app) =>
  app.post(
    "/",
    async ({ body: { direction, file } }) => {
      // const content = typeof file === "string" ? await downloadM3U8(file) : await file.text();
      let convertedFile: false | BunFile = false;
      switch (direction) {
        case "m3u8-mp4":
          convertedFile = await convertM3U8toMP4(file);
          break;
        case "m4a-mp4":
        case "m4v-mp4":
          convertedFile = await convertM4AVToMP4(file);
          break;
        case "mpd-mp4":
          convertedFile = await convertMPDtoMP4(file);
          break;
      }

      if (!convertedFile || !(await convertedFile.exists())) {
        throw new FailedConvertMedia();
      }

      return {
        url: getPublicFilePath(convertedFile),
        removeOn: getRemoveOnDate(),
      };
    },
    {
      body: ConvertBody,
    },
  ),
);
