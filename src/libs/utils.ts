import { BunFile } from "bun";

import config from "@/config";
import { log } from "@/logging";

function getUid() {
  return Bun.hash
    .wyhash(Date.now().toString(), config.converters.seed)
    .toString(16);
}

function getCurrentDate(asBase64 = false) {
  const date = new Date();
  const hours = date.getUTCHours();
  date.setUTCHours(hours % 2 !== 0 ? hours - 1 : hours, 0, 0, 0);
  const dateString = date.toISOString();
  return asBase64 ? btoa(dateString) : dateString;
}

function getRemoveOnDate(currentDate: Date) {
  const removeOnDate = new Date(currentDate);
  const hours = removeOnDate.getHours();
  removeOnDate.setHours(hours % 2 === 0 ? hours + 1 : hours + 2, 0, 0, 0);
  return removeOnDate.toISOString();
}

function getPublicFilePath(file: BunFile) {
  return (
    config.app.hostname +
    config.converters.publicPrefix +
    file.name
      ?.replace(config.app.publicPath, "")
      .replaceAll("\\\\", "/")
      .replaceAll("\\", "/")
  );
}

async function asyncWithTimelimit<T>(
  maxTime: number,
  task: Promise<unknown>,
  failureValue: unknown = null,
) {
  let timer: Timer | null = null;
  const response = await Promise.race([
    task,
    new Promise((resolve) => {
      timer = setTimeout(() => {
        log.warn(`async function timed out after ${maxTime} ms`);
        resolve(failureValue);
      }, maxTime);
    }),
  ]);
  if (timer) {
    clearTimeout(timer);
  }

  return response as T;
}

export {
  getUid,
  getCurrentDate,
  getRemoveOnDate,
  getPublicFilePath,
  asyncWithTimelimit,
};
