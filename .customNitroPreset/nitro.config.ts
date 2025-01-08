import { fileURLToPath } from "node:url";
import type { NitroPreset } from "nitropack";

export default {
  extends: "bun",
  entry: fileURLToPath(new URL("./entry.ts", import.meta.url)),
} as NitroPreset;
