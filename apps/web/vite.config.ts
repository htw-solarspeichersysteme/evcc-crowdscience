import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";
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
    {
      name: "run-jobs-on-dev-start",
      configureServer() {
        import("./src/jobs")
          .then(({ baker }) => {
            void baker.bakeAll();
            console.log("job runner started");
          })
          .catch((error) => {
            console.error("job runner failed to start", error);
          });
      },
    },
    tsConfigPaths(),
    tanstackStart(),
    devtoolsJson(),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    tailwindcss(),
    analyzer({ openAnalyzer: false }),
  ],
});
