import Elysia, { t } from "elysia";

const supportedMedia = "m3u8|m4v|m4a|mpd";
export const ConvertDirection = t.TemplateLiteral(`$\{${supportedMedia}}-mp4`);

export const convertModels = new Elysia().model({
  convert: t.Object({
    direction: ConvertDirection,
    file: t.String({
      // doesn't filter domains starting/ending with .- and-.
      // pattern: `http(s)?://.+.[a-zA-Z]{2,}/.+.(${supportedMedia})(.+)?`,
    }),
    extra_url: t.Optional(
      t.String({
        // doesn't filter domains starting/ending with .- and-.
        pattern: `http(s)?://.+.[a-zA-Z]{2,}/(.+)?`,
      }),
    ),
  }),
});
