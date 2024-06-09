import { Parser } from "m3u8-parser";

import config from "../../../config";

import { fetchWithTimeout } from "../../network";
import { log } from "../../../setup";

function getMediaGroup(mediaGroups: MediaGroup) {
  return Object.values(Object.values(mediaGroups.AUDIO)[0])[0];
}

function getBestPlaylist(playlists: Playlist[]) {
  return playlists.reduce((prev: Playlist, current: Playlist) =>
    prev?.attributes?.BANDWIDTH > current?.attributes?.BANDWIDTH ? prev : current,
  );
}

function replaceURLFileName(originalURL: string, newFileName: string): string {
  // replace filename in originalURL (if it doesn't contain https)
  if (/http(s)?:\/\//.test(newFileName)) {
    log.debug("skip", originalURL, newFileName);
    return newFileName;
  }

  if (!originalURL) {
    return newFileName;
  }

  let completeUrl: URL = new URL(originalURL);
  const filename = completeUrl.pathname.match(/([^/]+)\.m3u8/)?.[0];
  if (!filename) {
    log.info(`Unknown filename for ${completeUrl.href}`);
    return "";
  }

  completeUrl.pathname = completeUrl.pathname.replace(filename, newFileName);
  return completeUrl.href;
}

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

  url = replaceURLFileName(url, bestUrl.uri);
  parsedManifest = await loadM3U8(url);
  return [parsedManifest, hasOnlyAudio];
}

export {
  getMediaGroup,
  getBestPlaylist,
  replaceURLFileName,
  loadM3U8,
  downloadM3U8,
  getManifestWithBestBandwidth,
};
