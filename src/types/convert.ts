export const mediaFormats = ["m3u8", "m4a", "m4v", "mpd", "mp4"];
export type MediaFormat = (typeof mediaFormats)[number];
export const mediaDirections = mediaFormats
  .filter((format) => format !== "mp4")
  .map((format) => `${format}-mp4`);
export type MediaDirection = (typeof mediaDirections)[number];
export type ConvertStatus = "success" | "waiting" | "failed";

export type ConvertJobOpts = {
  hasOldConvert: boolean;
  direction: MediaDirection;
  file: string;
  file_hash: string;
};
