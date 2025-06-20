import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "src/renderer/clock"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, ".vite/renderer/clock_window"),
    rollupOptions: {
      input: resolve(__dirname, "src/renderer/clock/index.html"),
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5176, // Different port from other windows
  },
});
