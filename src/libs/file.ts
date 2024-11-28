import checkDiskSpace from "check-disk-space";

import config from "@/config";
import { getUid } from "./utils";

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

function byteToMegaByte(n: number) {
  return n / Math.pow(10, 6);
}

async function checkAvailableSpace() {
  const space = await checkDiskSpace(config.app.publicPath);
  const freeMegabytes = byteToMegaByte(space.free);
  return {
    freeMegabytes,
    isOk: freeMegabytes >= config.converters.minAvailableMegabytes,
  };
}

export {
  clearFileName,
  getFileNameByUrl,
  getInfoByFileName,
  appendToFileName,
  byteToMegaByte,
  checkAvailableSpace,
};
