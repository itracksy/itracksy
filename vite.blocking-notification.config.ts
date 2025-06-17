import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "src/renderer/blocking-notification"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, ".vite/build/renderer/blocking-notification"),
    rollupOptions: {
      input: resolve(__dirname, "src/renderer/blocking-notification/index.html"),
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5175, // Different port from main window and notification window
  },
});
