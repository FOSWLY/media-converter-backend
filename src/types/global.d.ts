declare module "bun" {
  interface Env {
    SERVICE_TOKEN: string;
    SERVICE_PORT: number;
    SERVICE_HOSTNAME: string;
    HASH_ALPHABET: string;
    LOKI_HOST: string;
    LOKI_USER: string;
    LOKI_PASSWORD: string;
    NODE_ENV: string;
  }
}

declare module "m3u8-parser" {
  class Parser {
    // based on https://github.com/videojs/m3u8-parser/pull/111/files
    constructor();
    push: (string: string) => void;
    end: () => void;
    manifest: import("./m3u8").Manifest;
  }
}

declare module "mpd-parser" {
  // return m3u8 manifest
  const parse: (
    manifest: string,
    options: Record<unknown, unknown> = {},
  ) => import("./m3u8").Manifest;
  const VERSION: string;
}
