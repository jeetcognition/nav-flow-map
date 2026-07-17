// Central config for values that were hard-coded across the legacy app.
// Override at build time via Vite env vars (VITE_*) when deploying elsewhere.

/** Cloudflare Worker that commits navmap-edits.json and starts AI promotion. */
export const SAVE_ENDPOINT =
  import.meta.env.VITE_SAVE_ENDPOINT ?? "https://navmap-save.jeet-navmap.workers.dev";

/** Committed baseline edits — merged over the base graph on load. */
export const EDITS_JSON_URL =
  import.meta.env.VITE_EDITS_JSON_URL ??
  "https://raw.githubusercontent.com/jeetcognition/nav-flow-map/main/navmap-edits.json";

export const DEFAULT_SURFACE = "enterprise";
