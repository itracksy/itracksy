import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/preload/notification.ts"),
      formats: ["cjs"],
      fileName: () => "notification.js",
    },
    outDir: resolve(__dirname, ".vite/build/preload"),
    rollupOptions: {
      external: ["electron"],
      output: {
        format: "cjs",
      },
    },
    emptyOutDir: false, // Don't clear the directory since main.js is already there
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
