import * as path from "node:path";

import Bree from "bree";

import { log } from "./setup";

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
});
