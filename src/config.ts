import * as path from "node:path";
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
  logging: {
    level: (Bun.env.NODE_ENV === "production" ? "info" : "debug") as Level,
    logPath: path.join(__dirname, "..", "logs"),
    loki: {
      host: Bun.env.LOKI_HOST ?? "",
      user: Bun.env.LOKI_USER ?? "",
      password: Bun.env.LOKI_PASSWORD ?? "",
    },
  },
  converters: {
    bannedChars: ["\\", "/", ":", "*", "?", '"', "<", ">", "|"],
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  },
};
