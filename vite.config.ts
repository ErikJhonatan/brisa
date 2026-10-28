import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, readdirSync } from "node:fs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "brisa-offline-shell",
      generateBundle(_, bundle) {
        const files = [
          "/",
          "/index.html",
          "/favicon.svg",
          "/manifest.webmanifest",
          "/voices/scripts.json",
          ...readdirSync(new URL('./public/voices/', import.meta.url)).filter(name => name.endsWith('.mp3')).map(name => '/voices/' + name),
          ...Object.keys(bundle)
            .filter((path) => /\.(css|js)$/.test(path))
            .map((path) => "/" + path),
        ];
        const source = readFileSync(
          new URL("./src/service-worker.js", import.meta.url),
          "utf8",
        )
          .replace("__PRECACHE__", JSON.stringify(files))
          .replace("__BUILD_ID__", Date.now().toString());
        this.emitFile({ type: "asset", fileName: "sw.js", source });
      },
    },
  ],
});
