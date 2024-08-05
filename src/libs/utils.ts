import config from "../config";
import { BunFile } from "bun";
import { log } from "../logging";

function getUid() {
  return Bun.hash.wyhash(Date.now().toString(), config.converters.seed).toString(16);
}

function getCurrentDate() {
  return new Date().toLocaleDateString("EN-US").replaceAll("/", "-");
}

function getRemoveOnDate() {
  const removeOn = new Date();
  removeOn.setDate(removeOn.getDate() + 1);
  removeOn.setHours(2, 0, 0, 0);
  return removeOn.toISOString();
}

function getPublicFilePath(file: BunFile) {
  return (
    config.app.hostname +
    config.converters.publicPrefix +
    file.name?.replace(config.app.publicPath, "").replaceAll("\\\\", "/").replaceAll("\\", "/")
  );
}

async function asyncWithTimelimit(
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

  return response;
}

export { getUid, getCurrentDate, getRemoveOnDate, getPublicFilePath, asyncWithTimelimit };
