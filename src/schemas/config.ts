import { Type as t, type Static } from "@sinclair/typebox";

import { version } from "../../package.json";

export const LoggingLevel = t.Union(
  [
    t.Literal("info"),
    t.Literal("debug"),
    t.Literal("fatal"),
    t.Literal("error"),
    t.Literal("warn"),
    t.Literal("trace"),
  ],
  {
    default: "info",
  },
);

const license = "MIT";
const scalarCDN = "https://unpkg.com/@scalar/api-reference@1.25.64/dist/browser/standalone.js";

export const ConfigSchema = t.Object({
  server: t.Object({
    port: t.Number({ default: 3001 }),
    hostname: t.String({ default: "0.0.0.0" }),
  }),
  app: t.Object({
    name: t.String({ default: "[FOSWLY] Media Converter Backend" }),
    desc: t.String({ default: "" }),
    version: t.Literal(version, { readOnly: true, default: version }),
    license: t.Literal(license, { readOnly: true, default: license }),
    github_url: t.String({
      default: "https://github.com/FOSWLY/media-converter-backend",
    }),
    contact_email: t.String({ default: "me@toil.cc" }),
    scalarCDN: t.Literal(scalarCDN, { readOnly: true, default: scalarCDN }),
    publicPath: t.String(),
    // domain for public access
    hostname: t.String({ default: "http://127.0.0.1:3001" }),
  }),
  cors: t.Object({
    "Access-Control-Allow-Origin": t.String({ default: "*" }),
    "Access-Control-Allow-Headers": t.String({ default: "*" }),
    "Access-Control-Allow-Methods": t.String({ default: "POST, GET, OPTIONS" }),
    "Access-Control-Max-Age": t.String({ default: "86400" }),
  }),
  logging: t.Object({
    level: LoggingLevel,
    logPath: t.String(),
    loki: t.Object({
      host: t.String({ default: "" }),
      user: t.String({ default: "" }),
      password: t.String({ default: "" }),
      label: t.String({ default: "media-converter-backend" }),
    }),
  }),
  db: t.Object({
    name: t.String({ default: "mconv-backend" }),
    host: t.String({ default: "127.0.0.1" }),
    port: t.Number({ default: 5432 }),
    user: t.String({ default: "postgres" }),
    password: t.String({ default: "postgres" }),
    outdatedInAdvance: t.Number({ default: 6_300_000 }), // in ms
  }),
  redis: t.Object({
    host: t.String({ default: "127.0.0.1" }),
    port: t.Number({ default: 6379 }),
    username: t.String({ default: "default" }),
    password: t.String({ default: "" }),
    prefix: t.String({ default: "mconvb" }), // Only for DB caching. BullMQ uses other prefix!
    ttl: t.Number({ default: 7200 }), // Only for DB caching. BullMQ uses own impl
  }),
  navigation: t.Object({
    defaultLimit: t.Number({ default: 10 }),
    maxLimit: t.Number({ default: 50 }),
    maxPage: t.Number({ default: 2147483647 }),
  }),
  converters: t.Object({
    bannedChars: t.Array(t.String(), {
      default: ["\\", "/", ":", "*", "?", '"', "<", ">", "|"],
    }),
    publicPrefix: t.String({
      default: "/v1/public",
    }),
    userAgent: t.String({
      default: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    }),
    seed: t.BigInt({
      default: 0xabcdn,
    }),
    minAvailableMegabytes: t.Number({
      default: 400,
    }),
  }),
});

export type ConfigSchemaType = Static<typeof ConfigSchema>;
