/* eslint-disable sonarjs/no-duplicate-string */
import { describe, expect, test } from "bun:test";
import { getFileNameByUrl, clearFileName } from "../src/libs/file";

describe("Get filename by url", () => {
  test("[mp4] clear", () => {
    expect(
      getFileNameByUrl("https://video.sibnet.ru/v/7fa09568a1c8f944f2c2d1e7d7accd3a/1320168.mp4"),
    ).toBe("1320168.mp4");
  });
  test("[m3u8] with query", () => {
    expect(
      getFileNameByUrl(
        "https://stream.mux.com/Pw9l02Hd02RR4AxoFXkAS5vxO1SAV1Ecp94bUdC9CMUTA.m3u8?token=eyJhbGciOiJSUzI1NiIsImtpZCI6Ik5CY3o3Sk5RcUNmdDdWcmo5MWhra2lEY3Vyc2xtRGNmSU1oSFUzallZMDI0IiwidHlwIjoiSldUIn0.eyJzdWIiOiJQdzlsMDJIZDAyUlI0QXhvRlhrQVM1dnhPMVNBVjFFY3A5NGJVZEM5Q01VVEEiLCJleHAiOjE3MTEzMjQ4MDAsImF1ZCI6InYiLCJwbGF5YmFja19yZXN0cmljdGlvbl9pZCI6IklyMDJGbXFzcVVuTUlwRXFIODlNZGx2V2ExNVF3T282ZENuZWxDdFNJOVlJIn0.eEd4nCKVxoBE-OlCzywPccrgawhSmWSRGc1Ak5qdvUSkHGEJIh6GNVRuIWZfPW5jTHf3u1einupxJ7Ngypgr3WfHPzU5jtLPJvremiZ6THIyD0oOSU2NVdnCfU0VuqPIVM1dAdm1aB6awWZcd86s8lSIJtaRiBzx0WAVnQkqOXut3CuQdqmRfGTbS_F3mUwakBeKaBD40HrZfH0-7EubxxKpDWTxfstel1On5RebjR4vzzEI5ISEsxq9uv7fn44ieCKzz37GyoxFc2LaktdfM4kVZ7cTv_skIfvbCUUMJvoMp_o5FYOufxc2wRLBYMi-X6R-Sw_ZQ2qrQ5-QVLky_g",
      ),
    ).toBe("Pw9l02Hd02RR4AxoFXkAS5vxO1SAV1Ecp94bUdC9CMUTA.m3u8");
  });
  test("[m3u8] with bad chars", () => {
    expect(
      getFileNameByUrl(
        "https://cloud.kodik-storage.com/useruploads/33d58a6a-6b46-434f-82d5-7f8e57c90348/ef0bfd1874ae5a65932b8e6e1896eca0:2024050107/360.mp4:hls:manifest.m3u8",
      ),
    ).toBe("360.mp4hlsmanifest.m3u8");
  });
  test("[m3u8] different letter cases", () => {
    expect(
      getFileNameByUrl(
        "https://v.redd.it/l0wpsygl8tpc1/HLSPlaylist.m3u8?f=sd%2ChlsSpecOrder&v=1&a=1713783928%2CMmIzZTVlZmE4MDBkODEzMzViMTdmNmY5YTI1MTIzYWI4YTNkM2E1NWFkMmRlOTBmNzFhMTI1N2UwMzkyM2VhNw%3D%3D",
      ),
    ).toBe("HLSPlaylist.m3u8");
  });
  test("[without ext]", () => {
    expect(getFileNameByUrl("https://example.com/test")).toBe("test");
  });
  test("[without ext] with trailing slash", () => {
    expect(getFileNameByUrl("https://example.com/test/")).toBe("test");
  });
  test("[mp4] local", () => {
    expect(getFileNameByUrl("file://home/test/local.mp4")).toBe("local.mp4");
  });
});

describe("Clear filename", () => {
  test("[mp4] clear", () => {
    expect(clearFileName("1320168.mp4")).toBe("1320168.mp4");
  });
  test("[m3u8] with bad chars", () => {
    expect(clearFileName("360.mp4:hls:manifest.m3u8")).toBe("360.mp4hlsmanifest.m3u8");
  });
  test("[without ext]", () => {
    expect(clearFileName("33d58a6a-6b46-434f-82d5-7f8e57c90348")).toBe(
      "33d58a6a-6b46-434f-82d5-7f8e57c90348",
    );
  });
  test("[without ext] with filetype", () => {
    expect(clearFileName("33d58a6a-6b46-434f-82d5-7f8e57c90348", ".mp4")).toBe(
      "33d58a6a-6b46-434f-82d5-7f8e57c90348.mp4",
    );
  });
  test("[empty]", () => {
    expect(clearFileName("")).not.toBe("");
  });
  test("[empty] with filetype", () => {
    expect(clearFileName("", ".mp4")).toEndWith(".mp4");
  });
});
