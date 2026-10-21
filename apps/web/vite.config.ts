import path from "path";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [
    {
      name: "run-jobs-on-dev-start",
      configureServer() {
        // resolved at runtime so the jobs (and their `~/` imports) stay out of the
        // bundled config
        import(/* @vite-ignore */ path.resolve(import.meta.dirname, "./src/jobs"))
          .then(({ baker }) => {
            void baker.bakeAll();
            console.log("job runner started");
          })
          .catch((error) => {
            console.error("job runner failed to start", error);
          });
      },
    },
    tanstackStart(),
    devtoolsJson(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    analyzer({ enabled: process.env.ANALYZE_BUNDLE === "true" }),
  ],
});
