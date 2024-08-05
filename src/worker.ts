// import path from "node:path";

// import Bree from "bree";

// import { log } from "./logging";

// export default new Bree({
//   logger: log,
//   root: path.join(__dirname, "jobs"),
//   defaultExtension: "ts",
//   jobs: [
//     {
//       name: "cleaner",
//       interval: "at 02:00 am",
//       timeout: 0,
//     },
//   ],
//   errorHandler: (error, workerMetadata) => {
//     // workerMetadata will be populated with extended worker information only if
//     // Bree instance is initialized with parameter `workerMetadata: true`
//     log.error(
//       workerMetadata.threadId
//         ? `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`
//         : `There was an error while running a worker ${workerMetadata.name}`,
//     );

//     log.error(error);
//   },
// });

/* eslint-disable @typescript-eslint/unbound-method */
import { Queue, QueueBaseOptions, Worker } from "bullmq";

import config from "./config";
import CleanerJob from "./jobs/cleaner";
import ConvertJob from "./jobs/convert";
import { log } from "./logging";

const { host, port, username, password } = config.redis;

const opts: QueueBaseOptions = {
  connection: {
    host,
    port,
    username,
    password,
  },
  prefix: "mconv",
};

const cleanerConcurrency = 5;
export const cleanerQueue = new Queue("cleaner", opts);
export const cleanerWorker = new Worker("cleaner", CleanerJob.processor, {
  ...opts,
  concurrency: cleanerConcurrency,
})
  .on("completed", CleanerJob.onCompleted)
  .on("failed", CleanerJob.onFailed);

const converterConcurrency = 200;
export const converterQueue = new Queue("converter", opts);
export const converterWorker = new Worker("converter", ConvertJob.processor, {
  ...opts,
  concurrency: converterConcurrency,
})
  .on("completed", ConvertJob.onCompleted)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .on("failed", ConvertJob.onFailed);

export async function initCleaner() {
  log.info("Cleaner initialized");
  await cleanerQueue.add("clean-files", null, {
    repeat: {
      pattern: "0 0 2 * * *",
    },
    removeOnComplete: true,
    removeOnFail: true,
  });
}
