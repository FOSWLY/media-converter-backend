import path from "node:path";
import { type Level } from "pino";

import { version } from "../package.json";

export default {
  server: {
    port: Bun.env.SERVICE_PORT ?? 3001,
    hostname: "0.0.0.0",
  },
  app: {
    name: "[FOSWLY] Media Converter Backend",
    desc: "",
    version,
    license: "MIT",
    github_url: "https://github.com/FOSWLY/media-converter-backend",
    contact_email: "me@toil.cc",
    scalarCDN: "https://unpkg.com/@scalar/api-reference@1.15.1/dist/browser/standalone.js",
    publicPath: path.join(__dirname, "..", "public"),
    hostname: Bun.env.SERVICE_HOSTNAME ?? "http://127.0.0.1:3001", // domain for public access
  },
  cors: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  },
  logging: {
    level: (Bun.env.NODE_ENV === "production" ? "info" : "debug") as Level,
    logPath: path.join(__dirname, "..", "logs"),
    loki: {
      host: Bun.env.LOKI_HOST ?? "",
      user: Bun.env.LOKI_USER ?? "",
      password: Bun.env.LOKI_PASSWORD ?? "",
      label: Bun.env.LOKI_LABEL ?? "media-converter-backend",
    },
  },
  db: {
    name: Bun.env.POSTGRES_NAME ?? "mconv-backend",
    host: Bun.env.POSTGRES_HOST ?? "127.0.0.1",
    port: Bun.env.POSTGRES_PORT ?? 5432,
    user: Bun.env.POSTGRES_USER ?? "postgres",
    password: Bun.env.POSTGRES_PASSWORD ?? "postgres",
    outdatedInAdvance: 6_300_000, // the time before deleting the data, after which we mark it as outdated (in ms). It should take less than 2 hours not to convert newly received files again!
  },
  redis: {
    host: Bun.env.REDIS_HOST ?? "127.0.0.1",
    port: Bun.env.REDIS_PORT ?? 6379,
    username: Bun.env.REDIS_USER ?? "default",
    password: Bun.env.REDIS_PASSWORD ?? "",
    prefix: Bun.env.REDIS_PREFIX ?? "mconvb", // Only for DB caching. BullMQ uses other prefix!
    ttl: Bun.env.REDIS_TTL ?? 7200, // Only for DB caching. BullMQ uses own impl
  },
  converters: {
    bannedChars: ["\\", "/", ":", "*", "?", '"', "<", ">", "|"],
    publicPrefix: "/v1/public",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    seed: BigInt(Bun.env.SEED) ?? 0xabcdn,
  },
};
