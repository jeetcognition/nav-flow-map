import { type Request } from "@playwright/test";

/**
 * Auth headers the enterprise API requires, captured from a request the page
 * itself issued: the in-memory bearer token plus the active-org header the
 * webapp sends alongside it. Replaying the bearer on its own is rejected with
 * 401, so every API-level spec replays both.
 */
export function apiAuthHeaders(request: Request): Record<string, string> {
  const captured = request.headers();
  const headers: Record<string, string> = { authorization: captured["authorization"] ?? "" };
  if (captured["x-cog-org-id"]) headers["x-cog-org-id"] = captured["x-cog-org-id"];
  return headers;
}
