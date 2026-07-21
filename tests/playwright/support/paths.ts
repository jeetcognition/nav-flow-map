// Central place for org slugs and URL builders so page objects/specs never hard-code paths.
// All environment-specific values are read from env vars with safe QA defaults.

export const ENTERPRISE_SLUG = process.env.ENTERPRISE_SLUG ?? "cog-enterprise-qa";
export const ENTERPRISE_NAME = process.env.ENTERPRISE_NAME ?? "Cog Enterprise QA";
export const TEST_SUBORG = process.env.TEST_SUBORG ?? "jeet-devin-qa";
export const TEST_SUBORG_DISPLAY = process.env.TEST_SUBORG_DISPLAY ?? "jeet-test-org";
export const ALT_SUBORG = process.env.ALT_SUBORG ?? "fri-5";
export const ALT_SUBORG_NAME = process.env.ALT_SUBORG_NAME ?? "fri-5";

/** Routes relative to BASE_URL (Playwright prepends baseURL automatically on page.goto). */
export const routes = {
  /** Login page. */
  login: "/login",

  /** Enterprise landing / org-selector ("Choose an organization to continue"). */
  orgSelector: `/org/${ENTERPRISE_SLUG}/org-selector`,

  /** Sub-org home. Pass a slug to target a specific sub-org. */
  subOrg: (slug: string = TEST_SUBORG) => `/org/${slug}`,

  /** Enterprise support page. */
  support: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/support`,

  /** Enterprise infrastructure page. */
  infrastructure: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/infrastructure`,

  /** Enterprise skills analytics page. */
  enterpriseSkills: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/enterprise-skills`,

  /** Enterprise sessions page (skill detail drill-down). */
  enterpriseSessions: (slug: string = ENTERPRISE_SLUG) =>
    `/org/${slug}/settings/enterprise-sessions`,

  /**
   * Membership page with optional tab.
   * The base route is `/settings/membership`; the enterprise-scoped routes use `/org/{slug}/settings/membership`.
   */
  membership: (tab?: "members" | "roles" | "groups") =>
    tab ? `/settings/membership?tab=${tab}` : `/settings/membership`,

  enterpriseMembership: (slug: string = ENTERPRISE_SLUG, tab?: "members" | "roles" | "groups") =>
    tab ? `/org/${slug}/settings/membership?tab=${tab}` : `/org/${slug}/settings/membership`,
} as const;
