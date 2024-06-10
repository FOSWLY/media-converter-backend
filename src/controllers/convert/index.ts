import { Elysia, t } from "elysia";
import { BunFile } from "bun";

import { FailedConvertMedia } from "../../errors";
import { getPublicFilePath, getRemoveOnDate } from "../../libs/utils";
import { ConvertBody } from "../../models/convert";
import { mediaFormat } from "../../types/convert";

import BaseConverter from "../../libs/converters/base";
import M4AVConverter from "../../libs/converters/m4av";
import M3U8Converter from "../../libs/converters/m3u8";
import MPDConverter from "../../libs/converters/mpd";

export default new Elysia().group("/convert", (app) =>
  app.post(
    "/",
    async ({ body: { direction, file } }) => {
      // const content = typeof file === "string" ? await downloadM3U8(file) : await file.text();
      const [fromFormat, toFormat] = direction.split("-") as mediaFormat[];
      let converter: BaseConverter = new BaseConverter(file, toFormat);
      switch (direction) {
        case "m3u8-mp4":
          converter = new M3U8Converter(file, toFormat);
          break;
        case "m4a-mp4":
        case "m4v-mp4":
          converter = new M4AVConverter(file, toFormat);
          break;
        case "mpd-mp4":
          converter = new MPDConverter(file, toFormat);
          break;
      }

      const convertedFile = await converter.convert();

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
