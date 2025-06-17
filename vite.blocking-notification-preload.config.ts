import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/preload/blocking-notification.ts"),
      formats: ["cjs"],
      fileName: () => "blocking-notification.js",
    },
    outDir: resolve(__dirname, ".vite/build/preload"),
    rollupOptions: {
      external: ["electron"],
      output: {
        format: "cjs",
      },
    },
    emptyOutDir: false, // Don't clear the directory since other preload files are already there
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
