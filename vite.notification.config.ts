import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "src/renderer/notification"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, ".vite/renderer/notification_window"),
    rollupOptions: {
      input: resolve(__dirname, "src/renderer/notification/index.html"),
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5174, // Different port from main window
  },
});
