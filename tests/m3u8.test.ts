/* eslint-disable sonarjs/no-duplicate-string */
import { describe, expect, test } from "bun:test";
import M3U8Converter from "../src/libs/converters/m3u8";

describe("load M3U8 Manifest", () => {
  test("full manifest", async () => {
    const converter = new M3U8Converter(
      "https://v.redd.it/l0wpsygl8tpc1/HLSPlaylist.m3u8?f=sd%2ChlsSpecOrder&v=1&a=1713783928%2CMmIzZTVlZmE4MDBkODEzMzViMTdmNmY5YTI1MTIzYWI4YTNkM2E1NWFkMmRlOTBmNzFhMTI1N2UwMzkyM2VhNw%3D%3D",
    );
    const manifest = await converter.loadManifest(converter.url);
    expect(manifest).toEqual({
      allowCache: true,
      discontinuityStarts: [],
      dateRanges: [],
      segments: [],
      version: 4,
      mediaGroups: {
        AUDIO: {
          "3": {
            "audio 0": {
              default: true,
              autoselect: true,
              uri: "HLS_AUDIO_64.m3u8",
            },
          },
          "4": {
            "audio 0": {
              default: true,
              autoselect: true,
              uri: "HLS_AUDIO_128.m3u8",
            },
          },
        },
        VIDEO: {},
        "CLOSED-CAPTIONS": {},
        SUBTITLES: {},
      },
      playlists: [
        {
          attributes: {
            AUDIO: "4",
            CODECS: "avc1.4D401E,mp4a.40.2",
            "FRAME-RATE": 30,
            RESOLUTION: { width: 640, height: 360 },
            "AVERAGE-BANDWIDTH": "759422",
            BANDWIDTH: 998212,
            "CLOSED-CAPTIONS": "NONE",
            "PROGRAM-ID": 0,
          },
          uri: "HLS_360.m3u8",
          timeline: 0,
        },
        {
          attributes: {
            AUDIO: "3",
            CODECS: "avc1.4D401E,mp4a.40.2",
            "FRAME-RATE": 30,
            RESOLUTION: { width: 392, height: 220 },
            "AVERAGE-BANDWIDTH": "311444",
            BANDWIDTH: 382430,
            "CLOSED-CAPTIONS": "NONE",
            "PROGRAM-ID": 0,
          },
          uri: "HLS_220.m3u8",
          timeline: 0,
        },
        {
          attributes: {
            AUDIO: "3",
            CODECS: "avc1.4D401E,mp4a.40.2",
            "FRAME-RATE": 30,
            RESOLUTION: { width: 480, height: 270 },
            "AVERAGE-BANDWIDTH": "485382",
            BANDWIDTH: 611790,
            "CLOSED-CAPTIONS": "NONE",
            "PROGRAM-ID": 0,
          },
          uri: "HLS_270.m3u8",
          timeline: 0,
        },
        {
          attributes: {
            AUDIO: "3",
            CODECS: "avc1.4D401E,mp4a.40.2",
            "FRAME-RATE": 30,
            RESOLUTION: { width: 640, height: 360 },
            "AVERAGE-BANDWIDTH": "695969",
            BANDWIDTH: 934398,
            "CLOSED-CAPTIONS": "NONE",
            "PROGRAM-ID": 0,
          },
          uri: "HLS_360.m3u8",
          timeline: 0,
        },
        {
          attributes: {
            AUDIO: "4",
            CODECS: "avc1.4D401E,mp4a.40.2",
            "FRAME-RATE": 30,
            RESOLUTION: { width: 392, height: 220 },
            "AVERAGE-BANDWIDTH": "374897",
            BANDWIDTH: 446244,
            "CLOSED-CAPTIONS": "NONE",
            "PROGRAM-ID": 0,
          },
          uri: "HLS_220.m3u8",
          timeline: 0,
        },
        {
          attributes: {
            AUDIO: "4",
            CODECS: "avc1.4D401E,mp4a.40.2",
            "FRAME-RATE": 30,
            RESOLUTION: { width: 480, height: 270 },
            "AVERAGE-BANDWIDTH": "548836",
            BANDWIDTH: 675604,
            "CLOSED-CAPTIONS": "NONE",
            "PROGRAM-ID": 0,
          },
          uri: "HLS_270.m3u8",
          timeline: 0,
        },
      ],
    });
  });
  test("manifest with best bandwidth", async () => {
    const converter = new M3U8Converter(
      "https://v.redd.it/l0wpsygl8tpc1/HLSPlaylist.m3u8?f=sd%2ChlsSpecOrder&v=1&a=1713783928%2CMmIzZTVlZmE4MDBkODEzMzViMTdmNmY5YTI1MTIzYWI4YTNkM2E1NWFkMmRlOTBmNzFhMTI1N2UwMzkyM2VhNw%3D%3D",
    );
    const manifest = await converter.getManifestWithBestBandwidth(converter.url);
    expect(manifest).toEqual({
      allowCache: true,
      discontinuityStarts: [],
      dateRanges: [],
      segments: [
        {
          duration: 4.011,
          byterange: { length: 32727, offset: 0 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33925, offset: 32727 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33774, offset: 66652 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33718, offset: 100426 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33674, offset: 134144 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33660, offset: 167818 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33684, offset: 201478 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33749, offset: 235162 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33702, offset: 268911 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33782, offset: 302613 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33621, offset: 336395 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33657, offset: 370016 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33667, offset: 403673 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33780, offset: 437340 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33702, offset: 471120 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33674, offset: 504822 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33745, offset: 538496 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33746, offset: 572241 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33714, offset: 605987 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33688, offset: 639701 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33585, offset: 673389 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33991, offset: 706974 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 4.011,
          byterange: { length: 33773, offset: 740965 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
        {
          duration: 2.049,
          byterange: { length: 17441, offset: 774738 },
          uri: "HLS_AUDIO_64.aac",
          timeline: 0,
        },
      ],
      version: 4,
      targetDuration: 4,
      playlistType: "VOD",
      mediaSequence: 0,
      discontinuitySequence: 0,
      endList: true,
    });
  });
  test("empty manifest", async () => {
    const converter = new M3U8Converter(
      "https://cloud.kodik-storage.com/useruploads/33d58a6a-6b46-434f-82d5-7f8e57c90348/3cb675bfd6c45ea9a877cbeed1323ba5:2024050202/360.mp4:hls:manifest.m3u8",
    );
    const manifest = await converter.getManifestWithBestBandwidth(converter.url);
    expect(manifest).toEqual({
      allowCache: true,
      discontinuityStarts: [],
      dateRanges: [],
      segments: [],
    });
  });
  test("stream", async () => {
    const converter = new M3U8Converter("https://s3.toil.cc/Radio_Record_mp3_320_kbps.m3u8");
    const manifest = await converter.getManifestWithBestBandwidth(converter.url);
    expect(manifest).toEqual({
      allowCache: true,
      discontinuityStarts: [],
      discontinuitySequence: 0,
      dateRanges: [],
      mediaSequence: 0,
      segments: [],
    });
  });
});
