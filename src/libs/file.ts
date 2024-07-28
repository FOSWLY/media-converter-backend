import { getUid } from "./utils";

import config from "../config";

function clearFileName(filename: string, filetype = ""): string {
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

function getInfoByFileName(filename: string) {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()! : "";
  return {
    ext,
    filename: parts.join().trim(),
  };
}

function appendToFileName(filename: string, text: string): string {
  const { ext, filename: name } = getInfoByFileName(filename);
  return name + text + (ext ? `.${ext}` : "");
}

export { clearFileName, getFileNameByUrl, getInfoByFileName, appendToFileName };
