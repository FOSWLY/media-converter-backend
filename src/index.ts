import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { HttpStatusCode } from "elysia-http-status-code";

import config from "@/config";
import { log } from "@/logging";
import { initCleaner } from "@/worker";
import {
  InternalServerError,
  UnAuthorizedError,
  VideoFileCouldntFound,
  UnSupportedMediaType,
  FailedConvertMedia,
} from "@/errors";
import { validateAuthToken } from "@/libs/security";

import healthController from "@/controllers/health";
import convertController from "@/controllers/convert";

const app = new Elysia({ prefix: "/v1" })
  .use(
    swagger({
      path: "/docs",
      scalarCDN: config.app.scalarCDN,
      documentation: {
        info: {
          title: config.app.name,
          version: config.app.version,
          license: {
            name: config.app.license,
          },
          contact: {
            name: "Developer",
            url: config.app.github_url,
            email: config.app.contact_email,
          },
        },
      },
    }),
  )
  .use(HttpStatusCode())
  .use(cors(config.cors))
  .use(
    staticPlugin({
      alwaysStatic: false,
    }),
  )
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
      error: (error as Error).message,
    };
  })
  .use(healthController)
  .guard(
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
    (app) => app.use(convertController),
  )
  .listen({
    port: config.server.port,
    hostname: config.server.hostname,
  });

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

void (async () => {
  await initCleaner();
})();
