import * as path from "node:path";
import { LoggerLevel } from "./types/logging";

export default {
  server: {
    port: Bun.env.SERVICE_PORT ?? 3001,
    hostname: "0.0.0.0",
  },
  app: {
    name: "[FOSWLY] Media Converter Backend",
    desc: "",
    version: "1.0.0",
    publicPath: path.join(__dirname, "..", "public"),
    hostname: Bun.env.SERVICE_HOSTNAME ?? "http://127.0.0.1:3001", // domain for public access
  },
  logging: {
    level: LoggerLevel.INFO,
    logRequests: false, // for debugging (true/false)
    logPath: path.join(__dirname, "..", "logs"),
  },
  converters: {
    bannedChars: ["\\", "/", ":", "*", "?", '"', "<", ">", "|"],
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  },
};
