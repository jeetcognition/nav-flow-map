import { type Page, type Request } from "@playwright/test";

// Thin wrappers around the guardrails REST API. The app authenticates API
// calls with a bearer token held in memory (not cookies), so specs capture the
// headers from a real request issued by the page and replay them here.

export interface GuardrailPolicy {
  id: string;
  is_enabled: boolean;
  action: string;
}

export interface GuardrailViolation {
  id: number;
  org_id: string;
  org_name: string;
  event_id: string;
  devin_id: string;
  guardrail_id: string;
  confidence_score: number;
  reasoning: string;
  user_message: string;
  action_taken: string;
  violation_source: string;
  created_at: string;
}

export interface GuardrailsApiContext {
  headers: Record<string, string>;
  enterpriseId: string;
}

/**
 * Capture the auth headers and enterprise id from the guardrails API call the
 * app makes while `load()` navigates to the Guardrails page.
 */
export async function captureGuardrailsApi(
  page: Page,
  load: () => Promise<void>,
): Promise<GuardrailsApiContext> {
  const reqPromise = page.waitForRequest((r: Request) =>
    /\/api\/enterprise\/enterprise-[0-9a-f]+\/guardrails$/.test(r.url()),
  );
  await load();
  const req = await reqPromise;
  const enterpriseId = /enterprise-[0-9a-f]+/.exec(req.url())![0];
  const captured = req.headers();
  const headers: Record<string, string> = { authorization: captured["authorization"] };
  if (captured["x-cog-org-id"]) headers["x-cog-org-id"] = captured["x-cog-org-id"];
  return { headers, enterpriseId };
}

export async function getGuardrails(
  page: Page,
  ctx: GuardrailsApiContext,
  enterpriseId: string = ctx.enterpriseId,
) {
  return page.request.get(`/api/enterprise/${enterpriseId}/guardrails`, { headers: ctx.headers });
}

export async function getViolations(
  page: Page,
  ctx: GuardrailsApiContext,
  enterpriseId: string = ctx.enterpriseId,
) {
  return page.request.get(`/api/enterprise/${enterpriseId}/guardrail-violations/?first=20`, {
    headers: ctx.headers,
  });
}

export async function putGuardrail(
  page: Page,
  ctx: GuardrailsApiContext,
  guardrailId: string,
  data: { is_enabled: boolean; action: string },
  enterpriseId: string = ctx.enterpriseId,
) {
  return page.request.put(`/api/enterprise/${enterpriseId}/guardrails/${guardrailId}`, {
    headers: ctx.headers,
    data,
  });
}

/** Fetch the current violations list, or [] when the request fails. */
export async function listViolations(
  page: Page,
  ctx: GuardrailsApiContext,
): Promise<GuardrailViolation[]> {
  const resp = await getViolations(page, ctx);
  if (!resp.ok()) return [];
  const body = (await resp.json()) as { violations: GuardrailViolation[] };
  return body.violations ?? [];
}

/** Fetch the configured action for one guardrail id (e.g. "profanity"). */
export async function getGuardrailAction(
  page: Page,
  ctx: GuardrailsApiContext,
  guardrailId: string,
): Promise<string> {
  const resp = await getGuardrails(page, ctx);
  if (!resp.ok()) return "";
  const policies = (await resp.json()) as GuardrailPolicy[];
  return policies.find((p) => p.id === guardrailId)?.action ?? "";
}
