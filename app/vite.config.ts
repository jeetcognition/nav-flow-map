import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // port 8899 is on the save worker's CORS allowlist, so "Save to repo"
  // works from local dev exactly like it does from the deployed site
  server: { port: 8899 },
});
