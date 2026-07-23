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

  /** Enterprise settings landing page. */
  entSettings: `/org/${ENTERPRISE_SLUG}/settings`,

  /** Enterprise → General settings. */
  entGeneral: `/org/${ENTERPRISE_SLUG}/settings/general`,

  /** Personal connections page. */
  personalConnections: "/settings/connections",

  /** Enterprise sessions page. */
  enterpriseSessions: (slug: string = ENTERPRISE_SLUG) =>
    `/org/${slug}/settings/enterprise-sessions`,

  /** Enterprise analytics page. */
  analytics: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/analytics`,

  /** Enterprise membership page. */
  membership: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/membership`,

  /** Build a membership URL with a tab query. */
  membershipTab: (
    tab: "members" | "roles" | "groups" = "members",
    slug: string = ENTERPRISE_SLUG,
  ) => `/org/${slug}/settings/membership?tab=${tab}`,

  /** Enterprise infrastructure page. */
  infrastructure: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/infrastructure`,

  /** Enterprise repositories settings page. */
  repositories: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/repositories`,

  /** Enterprise skills & rules analytics page. */
  enterpriseSkills: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/enterprise-skills`,

  /** Enterprise knowledge page. */
  enterpriseKnowledge: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/knowledge`,

  /** Enterprise Devin API page. */
  devinApi: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/devin-api`,

  /** Enterprise connections page. */
  connections: (slug: string = ENTERPRISE_SLUG) =>
    `/org/${slug}/settings/connections?tab=integrations`,

  /** Sub-org settings root. */
  settingsRoot: (slug: string = TEST_SUBORG) => `/org/${slug}/settings`,

  /** Enterprise guardrails page. */
  guardrails: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/guardrails`,

  /** Organizations list page. */
  organizations: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/organizations`,

  /** Enterprise Devin settings page. */
  devinSettings: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/enterprise-devin`,

  /** Enterprise environment page, optionally targeting a tab. */
  environment: (slug: string = ENTERPRISE_SLUG, tab?: string) =>
    `/org/${slug}/settings/enterprise-environment${tab ? `?tab=${tab}` : ""}`,

  /** Enterprise Devin Review settings page. */
  reviewSettings: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/review`,

  /** Enterprise Membership page, optionally targeting a tab. */
  membership: (slug: string = ENTERPRISE_SLUG, tab?: "members" | "roles" | "groups") =>
    `/org/${slug}/settings/membership${tab ? `?tab=${tab}` : ""}`,
} as const;
