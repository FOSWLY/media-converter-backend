import { Elysia } from "elysia";

import { convertModels } from "../../models/convert.model";
import { converterQueue } from "../../worker";
import config from "../../config";
import ConvertFacade from "../../facades/convert";
import { getRemoveOnDate } from "../../libs/utils";
import { log } from "../../logging";

export default new Elysia().group("/convert", (app) =>
  app.use(convertModels).post(
    "/",
    async ({ body: { direction, file } }) => {
      const file_hash = Bun.hash.wyhash(file, config.converters.seed).toString(16);
      const convert = await new ConvertFacade().get({
        direction,
        file_hash,
      });

      const convertStatus = String(convert?.status);
      let isOutdated = false;
      if (convertStatus === "success") {
        // if the time is close to deleting the data, then we make it obsolete
        const convertDate = new Date(convert!.created_at);
        const currentTime = Date.now();
        const potentialOutdateTime = new Date(convertDate).setHours(2, 0, 0, 0);

        // currentTime > potentialOutdateTime = false (too new, maybe the cleaning has already been done today)
        // potentialOutdateTime - config.db.outdatedInAdvance < convertDate.getTime() = false (it has already been done this day and will not be deleted during cleaning)
        isOutdated =
          currentTime < potentialOutdateTime
            ? convertDate.getTime() < potentialOutdateTime - config.db.outdatedInAdvance
            : false;
        log.debug(
          {
            isOutdated,
            convertDate,
            currentTime,
            potentialOutdateTime,
          },
          `Convert status: ${isOutdated ? "outdated" : "actual"}`,
        );
      }

      if (!isOutdated && ["success", "failed"].includes(convertStatus)) {
        const { id, direction, file_hash, download_url, created_at, message } = convert!;
        return {
          id,
          status: convertStatus,
          direction,
          file_hash,
          download_url,
          message,
          createdAt: created_at,
          removeOn: getRemoveOnDate(),
        };
      }

      if (!convert || isOutdated) {
        await converterQueue.add(
          `converter (${direction} ${file_hash})`,
          {
            hasOldConvert: isOutdated,
            direction,
            file,
            file_hash,
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

      if (convert && isOutdated) {
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
