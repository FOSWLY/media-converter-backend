import * as fs from "fs";
import { mkdir } from "node:fs/promises";

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { HttpStatusCode } from "elysia-http-status-code";

import config from "./config";
import bree from "./worker";
import setupElysia, { log } from "./setup";
import {
  InternalServerError,
  UnAuthorizedError,
  VideoFileCouldntFound,
  UnSupportedMediaType,
  FailedConvertMedia,
} from "./errors";

import { validateAuthToken } from "./libs/security";

import healthController from "./controllers/health";
import convertController from "./controllers/convert/m3u8-mp4";

if (!fs.existsSync(config.logging.logPath)) {
  await mkdir(config.logging.logPath, { recursive: true });
  log.info(`Created log directory`);
}

const app = new Elysia({ prefix: "/v1" })
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: config.app.name,
          version: config.app.version,
        },
      },
    }),
  )
  .use(setupElysia)
  .use(HttpStatusCode())
  .use(staticPlugin())
  .error({
    UNAUTHORIZED_ERROR: UnAuthorizedError,
    INTERNAL_SERVER_ERROR: InternalServerError,
    UNSUPPORTED_MEDIA_TYPE_ERROR: UnSupportedMediaType,
    VIDEO_FILE_COULDNT_FOUND: VideoFileCouldntFound,
    FAILED_CONVERT_MEDIA: FailedConvertMedia,
  })
  .onError(({ set, code, error, httpStatus }) => {
    switch (code) {
      case "NOT_FOUND":
        return {
          detail: "Route not found :(",
        };
      case "VALIDATION":
        return error.all;
      case "FAILED_CONVERT_MEDIA":
        set.status = httpStatus.HTTP_500_INTERNAL_SERVER_ERROR;
        break;
      case "UNSUPPORTED_MEDIA_TYPE_ERROR":
        set.status = httpStatus.HTTP_415_UNSUPPORTED_MEDIA_TYPE;
        break;
      case "UNAUTHORIZED_ERROR":
        set.status = httpStatus.HTTP_401_UNAUTHORIZED;
        break;
      case "VIDEO_FILE_COULDNT_FOUND":
        set.status = httpStatus.HTTP_400_BAD_REQUEST;
        break;
    }

    return {
      error: error.message,
    };
  })
  .use(healthController)
  .group(
    "",
    {
      headers: t.Object({
        authorization: t.String({
          title: "Authorization Basic token",
        }),
      }),
      beforeHandle: ({ headers: { authorization } }) => {
        if (!validateAuthToken(authorization)) return;
      },
    },
    // @ts-ignore: TS2345
    (app: Elysia) => app.use(convertController),
  )
  .listen({
    port: config.server.port,
    hostname: config.server.hostname,
  });

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

(async () => {
  await bree.start();
})();
