import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      target: "bun",
    }),
    devtoolsJson(),
    tailwindcss(),
  ],
});
