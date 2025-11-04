import { Readable, Writable } from "node:stream";
import zlib from "node:zlib";
import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_PATH,
  },
} satisfies Config;

/**
 * Polyfill CompressionStream
 * Stolen from https://github.com/drizzle-team/drizzle-orm/issues/3880#issuecomment-2727591652
 */
const transformMap = {
  deflate: zlib.createDeflate,
  "deflate-raw": zlib.createDeflateRaw,
  gzip: zlib.createGzip,
};

// @ts-ignore
globalThis.CompressionStream ??= class CompressionStream {
  readable;
  writable;
  constructor(format: "deflate" | "deflate-raw" | "gzip") {
    const handle = transformMap[format]();
    this.readable = Readable.toWeb(handle);
    this.writable = Writable.toWeb(handle);
  }
};
