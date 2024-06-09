declare module "m3u8-parser" {
  class Parser<T> {
    // based on https://github.com/videojs/m3u8-parser/pull/111/files
    constructor();
    push: (string: string) => void;
    end: () => void;
    manifest: Manifest;
  }
}
