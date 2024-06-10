import { parentPort } from "node:worker_threads";
import process from "node:process";

import * as path from "node:path";
import { readdir, rmdir } from "node:fs/promises";

import config from "../config";

import { getCurrentDate } from "../libs/utils";

async function clean(clearPath: string) {
  const currentDate = getCurrentDate();
  const files = await readdir(clearPath);
  return await Promise.all(
    files
      .filter((file) => file !== currentDate)
      .map(
        async (file) =>
          await rmdir(path.join(clearPath, file), {
            recursive: true,
          }),
      ),
  );
}

await clean(path.join(config.app.publicPath, "media", "mp4")); // public
await clean(path.join(__dirname, "../libs/converters/temp")); // temp

// signal to parent that the job is done
if (parentPort) parentPort.postMessage("done");
else process.exit(0);
