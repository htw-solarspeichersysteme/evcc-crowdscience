// app.config.ts
import path from "path";
import { defineConfig } from "@tanstack/start/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    routeToken: "layout",
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
    css: {
      postcss: "./postcss.config.js",
    },
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./app"),
      },
    },
  },
  server: {
    preset: "bun",
  },
});
