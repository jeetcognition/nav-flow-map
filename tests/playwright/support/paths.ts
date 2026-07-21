// Central place for org slugs and URL builders so page objects/specs never hard-code paths.
// All environment-specific values are read from env vars with safe QA defaults.

export const ENTERPRISE_SLUG = process.env.ENTERPRISE_SLUG ?? "cog-enterprise-qa";
export const TEST_SUBORG = process.env.TEST_SUBORG ?? "jeet-devin-qa";

/** Routes relative to BASE_URL (Playwright prepends baseURL automatically on page.goto). */
export const routes = {
  /** Login page. */
  login: "/login",

  /** Enterprise landing / org-selector ("Choose an organization to continue"). */
  orgSelector: `/org/${ENTERPRISE_SLUG}/org-selector`,

  /** Sub-org home. Pass a slug to target a specific sub-org. */
  subOrg: (slug: string = TEST_SUBORG) => `/org/${slug}`,

  /** Enterprise-level support page. */
  support: `/org/${ENTERPRISE_SLUG}/settings/support`,

  /** Enterprise settings root. */
  enterpriseSettings: `/org/${ENTERPRISE_SLUG}/settings`,

  /** Sub-org secrets page. */
  secrets: (slug: string = TEST_SUBORG) => `/org/${slug}/settings/secrets`,
} as const;
