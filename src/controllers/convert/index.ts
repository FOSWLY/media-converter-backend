import { Elysia, t } from "elysia";
import config from "../../config";
import { FailedConvertMedia } from "../../errors";
import convertM3U8toMP4 from "../../libs/converters/m3u8/converter";

const bannedChars = [...config.converters.bannedChars, "."];

function normalizeVideoId(videoId: string | number): string {
  videoId = videoId.toString();

  for (const banned of bannedChars) {
    videoId = videoId.replaceAll(banned, "");
  }

  return videoId;
}

export default new Elysia().group("/convert", (app) =>
  app.post(
    "/m3u8-mp4",
    async ({ body: { file } }) => {
      // const content = typeof file === "string" ? await downloadM3U8(file) : await file.text();
      const convertedFile = await convertM3U8toMP4(file);
      if (!convertedFile || !(await convertedFile.exists())) {
        throw new FailedConvertMedia();
      }

      let removeOn = new Date();
      removeOn.setDate(removeOn.getDate() + 1);
      removeOn.setHours(2, 0, 0, 0);

      return {
        url:
          config.app.hostname +
          convertedFile.name
            ?.replace(config.app.publicPath, "")
            .replaceAll("\\\\", "/")
            .replaceAll("\\", "/"),
        removeOn: removeOn.toLocaleString("sv", { timeZoneName: "short" }),
      };
    },
    {
      body: t.Object({
        // file: t.Union([
        //   t.File({
        //     type: "application/vnd.apple.mpegurl"
        //   }),
        //   t.String({
        //     // doesn't filter domains starting/ending with .- and-.
        //     pattern: "http(s)?://.+.[a-zA-Z]{2,}/.+(.m3u8)(.+)?",
        //     format: "uri-reference",
        //   }),
        // ]),
        file: t.String({
          // doesn't filter domains starting/ending with .- and-.
          pattern: "http(s)?://.+.[a-zA-Z]{2,}/.+(.m3u8)(.+)?",
        }),
      }),
    },
  ),
);
