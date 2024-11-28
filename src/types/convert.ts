export const mediaFormats = ["m3u8", "m4a", "m4v", "mpd", "mp4"] as const;
export type MediaFormat = (typeof mediaFormats)[number];
export type MediaDirection = `${Exclude<MediaFormat, "mp4">}-mp4`;
export const mediaDirections = mediaFormats
  .filter((format) => format !== "mp4")
  .map((format) => `${format}-mp4`) as MediaDirection[];
export type ConvertStatus = "success" | "waiting" | "failed";

export type ConvertJobOpts = {
  direction: MediaDirection;
  file: string;
  file_hash: string;
  extra_url: string | null;
};
