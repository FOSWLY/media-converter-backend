import { getUid } from "./utils";

import config from "../config";

function clearFileName(filename: string, filetype: string = ""): string {
  if (filename.trim().length === 0) {
    return getUid() + filetype;
  }

  for (const banned of config.converters.bannedChars) {
    filename = filename.replaceAll(banned, "");
  }

  if (filetype && !filename.endsWith(filetype)) {
    filename += filetype;
  }

  return filename;
}

function getFileNameByUrl(fileUrl: string): string {
  const url = new URL(fileUrl);
  const pathArray = url.pathname.split("/").filter((path) => path);

  return clearFileName(pathArray?.[pathArray.length - 1]);
}

export { clearFileName, getFileNameByUrl };
