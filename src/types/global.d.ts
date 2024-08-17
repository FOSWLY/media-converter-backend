declare module "bun" {
  interface Env {
    SERVICE_TOKEN: string;
    SERVICE_PORT: number;
    SERVICE_HOSTNAME: string;
    POSTGRES_NAME: string;
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_USER: string;
    REDIS_PASSWORD: string;
    LOKI_HOST: string;
    LOKI_USER: string;
    LOKI_PASSWORD: string;
    SEED: string;
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
  // return mpd (m3u8 like) manifest
  const parse: (
    manifest: string,
    options: Record<unknown, unknown> = {},
  ) => import("./mpd").Manifest;
  const VERSION: string;
}
