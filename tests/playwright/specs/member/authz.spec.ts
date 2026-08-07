import { test, expect } from "@playwright/test";
import { ENTERPRISE_SLUG, TEST_SUBORG } from "../../support/paths";

// Non-admin (enterprise Member) authorization coverage. Runs under the `member`
// project, which reuses the .auth/member.json session captured by
// auth.setup.ts's "authenticate as member" setup.
//
// The member is a plus-alias of the QA inbox, invited as a plain Member of the
// enterprise and of the TEST_SUBORG organization — it holds no admin role.

const settings = (slug: string, page = "") => `/org/${slug}/settings${page ? `/${page}` : ""}`;

// Admin-only enterprise settings pages, as observed live for this member.
const DENIED_PAGES = [
  "connections",
  "enterprise-devin",
  "review",
  "enterprise-environment",
  "membership",
  "organizations",
  "devin-api",
  "guardrails",
  "infrastructure",
  "usage-policies",
  "secrets",
];

// Pages a plain member may read.
const ALLOWED_PAGES = ["knowledge", "playbooks", "repositories", "analytics", "support"];

test.describe("Non-admin member authorization", () => {
  test("MBR-REG01 — Admin-only enterprise settings pages return an Access denied panel", async ({
    page,
  }) => {
    for (const slug of DENIED_PAGES) {
      await page.goto(settings(ENTERPRISE_SLUG, slug));
      await expect(page.getByText("Access denied"), `expected ${slug} to be denied`).toBeVisible();
      await expect(page.getByText("You don't have permission to view this page.")).toBeVisible();
      // The denial is a real gate, not a rendered-but-empty admin page: none of
      // the admin surfaces leak through.
      await expect(page.getByRole("button", { name: "Back to enterprise" })).toHaveCount(0);
    }
  });

  test("MBR-REG02 — Member-readable enterprise pages load normally", async ({ page }) => {
    for (const slug of ALLOWED_PAGES) {
      await page.goto(settings(ENTERPRISE_SLUG, slug));
      await expect(page.getByText("Access denied"), `expected ${slug} to load`).toHaveCount(0);
      await expect(page.locator("main")).not.toBeEmpty();
    }
  });

  test("MBR-REG03 — The settings hub hides admin-only entries from a member", async ({ page }) => {
    await page.goto(settings(ENTERPRISE_SLUG));
    await expect(page.getByRole("heading", { name: "Enterprise Settings" })).toBeVisible();

    const hub = page.locator("main");
    // Visible to a member.
    for (const label of ["Knowledge", "Playbooks", "Repositories", "Analytics"]) {
      await expect(hub.getByText(label, { exact: true })).toBeVisible();
    }
    // Admin-only entries are absent from the hub, matching the route gate.
    for (const label of [
      "General",
      "Connections",
      "Membership",
      "Organizations",
      "Devin API",
      "Guardrails",
      "Infrastructure",
      "Usage Policies",
    ]) {
      await expect(hub.getByText(label, { exact: true }), `${label} should be hidden`).toHaveCount(
        0,
      );
    }
  });

  test("MBR-REG04 — The enterprise General page silently redirects a member to the hub", async ({
    page,
  }) => {
    await page.goto(settings(ENTERPRISE_SLUG, "general"));
    // Product behavior: General redirects to the hub rather than showing the
    // Access denied panel used by the other admin-only routes.
    await expect(page).toHaveURL(new RegExp(`${settings(ENTERPRISE_SLUG)}$`));
    await expect(page.getByRole("heading", { name: "Enterprise Settings" })).toBeVisible();
  });

  test("MBR-REG05 — A member keeps access to their own organization's settings", async ({
    page,
  }) => {
    await page.goto(settings(TEST_SUBORG, "members"));
    await expect(page.getByRole("heading", { name: "Membership" })).toBeVisible();
    await expect(page.getByText("Access denied")).toHaveCount(0);

    await page.goto(settings(TEST_SUBORG, "secrets"));
    await expect(page.getByRole("heading", { name: "Secrets" })).toBeVisible();
    await expect(page.getByText("Access denied")).toHaveCount(0);
  });

  test("MBR-REG06 — Enterprise admin APIs reject the member's own bearer token", async ({
    page,
    context,
  }) => {
    // The app authenticates with a bearer token, not cookies, so a bare fetch()
    // is always 401. Capture the member's real token from one of its own
    // requests and replay it against admin-only endpoints — this is the
    // backend gate, independent of the UI.
    let token: string | undefined;
    page.on("request", (request) => {
      const header = request.headers().authorization;
      if (!token && header) token = header;
    });
    await page.goto(settings(ENTERPRISE_SLUG, "knowledge"));
    await expect.poll(() => token, { timeout: 30_000 }).toBeTruthy();

    for (const endpoint of [
      "/api/enterprise/idp-groups",
      "/api/enterprise/all-organizations/paginated?first=25",
    ]) {
      const response = await context.request.get(endpoint, {
        headers: { authorization: token! },
      });
      expect(response.status(), `${endpoint} should be forbidden`).toBe(403);
    }
  });

  test("MBR-REG07 — Organization listings are scoped to the member's own memberships", async ({
    page,
    context,
  }) => {
    let token: string | undefined;
    page.on("request", (request) => {
      const header = request.headers().authorization;
      if (!token && header) token = header;
    });
    await page.goto(settings(ENTERPRISE_SLUG, "knowledge"));
    await expect.poll(() => token, { timeout: 30_000 }).toBeTruthy();

    const response = await context.request.get("/api/enterprise/organizations", {
      headers: { authorization: token! },
    });
    expect(response.status()).toBe(200);

    // A member sees only the organizations it belongs to — not the whole
    // enterprise tenant list an admin receives.
    const names = ((await response.json()) as { name?: string }[]).map((org) => org.name);
    expect(names).toContain(TEST_SUBORG);
    expect(names.length).toBeLessThan(10);
  });
});
