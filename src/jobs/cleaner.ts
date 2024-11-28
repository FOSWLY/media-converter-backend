import path from "node:path";
import { readdir, rmdir } from "node:fs/promises";

import { Job } from "bullmq";

import config from "@/config";
import ConvertFacade from "@/facades/convert";
import { getCurrentDate } from "@/libs/utils";
import { log } from "@/logging";

export default abstract class CleanerJob {
  static async clean(clearPath: string) {
    const currentDate = getCurrentDate(true);
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

  static async processor() {
    const currentDate = getCurrentDate();
    const date = new Date(currentDate);
    await CleanerJob.clean(path.join(config.app.publicPath, "media", "mp4")); // public
    await CleanerJob.clean(path.join(__dirname, "../libs/converters/temp")); // temp

    await new ConvertFacade().deleteByLessTime(date); // remove all converts less date
  }

  static onFailed(job: Job | undefined, error: Error) {
    log.error(`${job?.id} has failed with ${error.message}`);
  }

  static onCompleted(job: Job) {
    log.info(`Job ${job.id} has completed!`);
  }
}
