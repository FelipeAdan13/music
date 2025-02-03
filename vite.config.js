import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  assetsInclude: ["**/*.ogg", "**/*.mp4"],
  publicDir: "public",
});
