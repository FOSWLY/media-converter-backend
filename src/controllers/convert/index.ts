import { Elysia } from "elysia";

import config from "@/config";
import ConvertFacade from "@/facades/convert";
import { convertModels } from "@/models/convert.model";
import { converterQueue } from "@/worker";
import { getRemoveOnDate } from "@/libs/utils";
import { checkAvailableSpace } from "@/libs/file";

export default new Elysia().group("/convert", (app) =>
  app.use(convertModels).post(
    "/",
    async ({ body: { direction, file, extra_url } }) => {
      const file_hash = Bun.hash.wyhash(file, config.converters.seed).toString(16);
      const convert = await new ConvertFacade().get({
        direction,
        file_hash,
      });

      const convertStatus = String(convert?.status);
      if (["success", "failed"].includes(convertStatus)) {
        const { id, direction, file_hash, download_url, created_at, message } = convert!;
        const createdAtDate = new Date(created_at);
        return {
          id,
          status: convertStatus,
          direction,
          file_hash,
          download_url,
          message,
          createdAt: created_at,
          removeOn: getRemoveOnDate(createdAtDate),
        };
      }

      if (!convert) {
        const availableSpace = await checkAvailableSpace();
        if (!availableSpace.isOk) {
          return {
            status: "failed",
            message:
              "There isn't enough space available on the server to perform the convert. Please wait until the next automatic cleanup (every 2 hours) to continue.",
          };
        }

        await converterQueue.add(
          `converter (${direction} ${file_hash} ${extra_url})`,
          {
            direction,
            file,
            file_hash,
            extra_url,
          },
          {
            removeOnComplete: {
              age: 3600,
              count: 1000,
            },
            removeOnFail: true,
            debounce: { id: `${direction}-${file}`, ttl: 5000 },
          },
        );
      }

      if (convert) {
        convert.message = null;
      }

      return {
        status: "waiting",
        message: convert?.message ?? "We are converting the file, wait a bit",
      };
    },
    {
      body: "convert",
      detail: {
        summary: "Convert video url to media file",
        tags: ["Convert"],
      },
    },
  ),
);
