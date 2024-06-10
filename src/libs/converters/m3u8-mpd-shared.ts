import { log } from "../../setup";

function getMediaGroup(mediaGroups: MediaGroup) {
  return Object.values(Object.values(mediaGroups.AUDIO)[0])[0];
}

function getBestPlaylist(playlists: Playlist[]) {
  return playlists.reduce((prev: Playlist, current: Playlist) =>
    prev?.attributes?.BANDWIDTH > current?.attributes?.BANDWIDTH ? prev : current,
  );
}

function replaceURLFileName(originalURL: string, newFileName: string, fileRe: RegExp): string {
  // replace filename in originalURL (if it doesn't contain https)
  if (/http(s)?:\/\//.test(newFileName)) {
    log.debug("skip", originalURL, newFileName);
    return newFileName;
  }

  if (!originalURL) {
    return newFileName;
  }

  let completeUrl: URL = new URL(originalURL);
  const filename = completeUrl.pathname.match(fileRe)?.[0];
  if (!filename) {
    log.info(`Unknown filename for ${completeUrl.href}`);
    return "";
  }

  completeUrl.pathname = completeUrl.pathname.replace(filename, newFileName);
  return completeUrl.href;
}

export { getMediaGroup, getBestPlaylist, replaceURLFileName };
