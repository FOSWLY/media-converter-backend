import { parse } from "mpd-parser";

import config from "../../../config";
import { log } from "../../../setup";
import { fetchWithTimeout } from "../../network";
import { getBestPlaylist, getMediaGroup, replaceURLFileName } from "../m3u8-mpd-shared";

const m4avRe = /\.m4(a|v)/;
const m4sRe = /\.m4s/;
const mpdRe = /([^/]+)\.(mpd|xml)/;

async function downloadMPD(url: string) {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": config.converters.userAgent,
      },
    });

    return await res.text();
  } catch (err: any) {
    log.error(`Failed to download mpd xml: ${url}. Error: ${err.message}`);
    return "";
  }
}

async function loadMPD(content: string) {
  const manifestText = !content.startsWith("<?xml") ? await downloadMPD(content) : content;

  const manifest = parse(manifestText);
  // filter title for twitch m3u8 modified format
  // we believe that streams have a duration of < 1 sec
  manifest.segments = manifest.segments.filter(
    (segment) => segment.duration >= 1 && (segment as any)?.title !== "live",
  );

  return manifest;
}

function getBestMPDFile(candidate: AudioGroupItem | Playlist, hasOnlyAudio: boolean) {
  if (candidate.uri) {
    return candidate.uri;
  }

  if (!hasOnlyAudio && (candidate as Playlist)?.resolvedUri?.match(m4avRe)) {
    return (candidate as Playlist)?.resolvedUri;
  }

  if (!(candidate as AudioGroupItem)?.playlists) {
    return false;
  }

  const playlist = getBestPlaylist((candidate as AudioGroupItem).playlists as Playlist[]);
  return getBestMPDFile(playlist, false);
}

async function getManifestWithBestBandwidth(
  content: string,
  templateUrl: string = "",
): Promise<[Manifest | string, boolean]> {
  let parsedManifest = await loadMPD(content);
  if (!parsedManifest.playlists?.length && !parsedManifest.mediaGroups?.AUDIO) {
    return [parsedManifest, false];
  }

  // we assume that if there is a separate audio, then there will be no built-in audio in the video
  const hasOnlyAudio = !!(
    parsedManifest.mediaGroups?.AUDIO && Object.keys(parsedManifest.mediaGroups?.AUDIO).length > 0
  );

  const candidate = hasOnlyAudio
    ? getMediaGroup(parsedManifest.mediaGroups as MediaGroup)
    : getBestPlaylist(parsedManifest.playlists as Playlist[]);

  const bestUrl = getBestMPDFile(candidate, hasOnlyAudio);
  if (!bestUrl) {
    return [parsedManifest, hasOnlyAudio];
  }

  const url = replaceURLFileName(templateUrl, bestUrl, mpdRe);
  if (url.match(m4avRe)) {
    return [url, hasOnlyAudio];
  }

  parsedManifest = await loadMPD(url);
  return [parsedManifest, hasOnlyAudio];
}

export { loadMPD, downloadMPD, getManifestWithBestBandwidth, m4avRe, m4sRe, mpdRe };
