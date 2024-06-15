import { Elysia } from "elysia";

import { FailedConvertMedia } from "../../errors";
import { getPublicFilePath, getRemoveOnDate } from "../../libs/utils";
import { convertModels } from "../../models/convert.model";
import { mediaFormat } from "../../types/convert";

import BaseConverter from "../../libs/converters/base";
import M4AVConverter from "../../libs/converters/m4av";
import M3U8Converter from "../../libs/converters/m3u8";
import MPDConverter from "../../libs/converters/mpd";

export default new Elysia().group("/convert", (app) =>
  app.use(convertModels).post(
    "/",
    async ({ body: { direction, file } }) => {
      // const content = typeof file === "string" ? await downloadM3U8(file) : await file.text();
      const [fromFormat, toFormat] = direction.split("-") as mediaFormat[];
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

      const convertedFile = await new converter(file, toFormat).convert();
      if (!convertedFile || !(await convertedFile.exists())) {
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
