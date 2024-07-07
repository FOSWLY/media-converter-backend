/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as path from "node:path";

import Bree from "bree";

import { log } from "./logging";

export default new Bree({
  logger: log,
  root: path.join(__dirname, "jobs"),
  defaultExtension: "ts",
  jobs: [
    {
      name: "cleaner",
      interval: "at 02:00 am",
      timeout: 0,
    },
  ],
  errorHandler: (error, workerMetadata) => {
    // workerMetadata will be populated with extended worker information only if
    // Bree instance is initialized with parameter `workerMetadata: true`
    log.error(
      workerMetadata.threadId
        ? `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`
        : `There was an error while running a worker ${workerMetadata.name}`,
    );

    log.error(error);
  },
});
