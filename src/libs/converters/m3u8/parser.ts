import { Parser } from "m3u8-parser";

import config from "../../../config";

import { getBestPlaylist, getMediaGroup, replaceURLFileName } from "../m3u8-mpd-shared";
import { fetchWithTimeout } from "../../network";
import { log } from "../../../setup";

const m3u8Re = /([^/]+)\.m3u8/;

async function downloadM3U8(url: string) {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": config.converters.userAgent,
      },
    });

    return await res.text();
  } catch (err: any) {
    log.error(`Failed to download m3u8: ${url}. Error: ${err.message}`);
    return "";
  }
}

async function loadM3U8(content: string) {
  const parser = new Parser();
  const manifestText = content.match(/http(s)?:\/\//) ? await downloadM3U8(content) : content;
  parser.push(manifestText);
  parser.end();

  const manifest = parser.manifest;
  // filter title for twitch m3u8 modified format
  // we believe that streams have a duration of < 1 sec
  manifest.segments = manifest.segments.filter(
    (segment) => segment.duration >= 1 && (segment as any)?.title !== "live",
  );

  return manifest;
}

async function getManifestWithBestBandwidth(url: string): Promise<[Manifest, boolean]> {
  let parsedManifest = await loadM3U8(url);
  if (!parsedManifest.playlists?.length && !parsedManifest.mediaGroups?.AUDIO) {
    return [parsedManifest, false];
  }

  // we assume that if there is a separate audio, then there will be no built-in audio in the video
  const hasOnlyAudio = !!(
    parsedManifest.mediaGroups?.AUDIO && Object.keys(parsedManifest.mediaGroups?.AUDIO).length > 0
  );

  const bestUrl = hasOnlyAudio
    ? getMediaGroup(parsedManifest.mediaGroups as MediaGroup)
    : getBestPlaylist(parsedManifest.playlists as Playlist[]);

  url = replaceURLFileName(url, bestUrl.uri, m3u8Re);
  parsedManifest = await loadM3U8(url);
  return [parsedManifest, hasOnlyAudio];
}

export { loadM3U8, downloadM3U8, getManifestWithBestBandwidth, m3u8Re };
