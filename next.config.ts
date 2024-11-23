/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { NextConfig } from "next";
import "./src/env";

const config: NextConfig = {
  webpack: (config) => {
    config.externals.push("bun:sqlite");
    return config;
  },
};

export default config;
