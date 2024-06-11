import Elysia, { t } from "elysia";

const supportedMedia = "m3u8|m4v|m4a|mpd";
export const ConvertDirection = t.TemplateLiteral(`$\{${supportedMedia}}-mp4`);

export const convertModels = new Elysia().model({
  convert: t.Object({
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
    direction: ConvertDirection,
    file: t.String({
      // doesn't filter domains starting/ending with .- and-.
      pattern: `http(s)?://.+.[a-zA-Z]{2,}/.+.(${supportedMedia})(.+)?`,
    }),
  }),
});
