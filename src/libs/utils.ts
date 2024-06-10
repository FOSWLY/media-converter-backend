import Sqids from "sqids";
import config from "../config";
import { BunFile } from "bun";

const sqids = new Sqids({
  minLength: 8,
  alphabet: Bun.env.HASH_ALPHABET,
});

function getUid() {
  const numberCode = +`${Math.floor(Date.now() / 1000)}`;
  return sqids.encode([numberCode]);
}

function getCurrentDate() {
  return new Date().toLocaleDateString("EN-US").replaceAll("/", "-");
}

function getRemoveOnDate() {
  let removeOn = new Date();
  removeOn.setDate(removeOn.getDate() + 1);
  removeOn.setHours(2, 0, 0, 0);
  return removeOn.toLocaleString("sv", { timeZoneName: "short" });
}

function getPublicFilePath(file: BunFile) {
  return (
    config.app.hostname +
    file.name?.replace(config.app.publicPath, "").replaceAll("\\\\", "/").replaceAll("\\", "/")
  );
}

export { getUid, getCurrentDate, getRemoveOnDate, getPublicFilePath };
