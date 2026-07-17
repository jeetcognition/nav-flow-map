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

/** Base URL for Devin session deep links; the session id is appended. */
export const DEVIN_SESSION_BASE_URL =
  import.meta.env.VITE_DEVIN_SESSION_BASE_URL ?? "https://app.devin.ai/sessions";

/** Deep link to a Devin session by id. */
export const devinSessionUrl = (id: string) => `${DEVIN_SESSION_BASE_URL}/${id}`;
