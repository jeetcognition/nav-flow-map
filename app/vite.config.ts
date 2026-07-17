import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // deployed as a GitHub Pages project site under /nav-flow-map/
  base: command === "build" ? "/nav-flow-map/" : "/",
  // port 8899 is on the save worker's CORS allowlist, so "Save to repo"
  // works from local dev exactly like it does from the deployed site
  server: { port: 8899 },
}));
