// Central place for org slugs and URL builders so page objects/specs never hard-code paths.
// All environment-specific values are read from env vars with safe QA defaults.

export const ENTERPRISE_SLUG = process.env.ENTERPRISE_SLUG ?? "cog-enterprise-qa";
export const ENTERPRISE_NAME = process.env.ENTERPRISE_NAME ?? "Cog Enterprise QA";
export const TEST_SUBORG = process.env.TEST_SUBORG ?? "jeet-devin-qa";
export const TEST_SUBORG_DISPLAY = process.env.TEST_SUBORG_DISPLAY ?? "jeet-test-org";
export const ALT_SUBORG = process.env.ALT_SUBORG ?? "fri-5";
export const ALT_SUBORG_NAME = process.env.ALT_SUBORG_NAME ?? "fri-5";
export const WIKI_REPO_OWNER = process.env.WIKI_REPO_OWNER ?? "jeetcognition";
export const WIKI_REPO_NAME = process.env.WIKI_REPO_NAME ?? "empty";

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

  /** Personal preferences page. */
  preferences: "/settings/preferences",

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

  /** Enterprise playbooks page. */
  playbooks: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/playbooks`,

  /** Enterprise Devin API page. */
  devinApi: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/devin-api`,

  /** Enterprise connections page. */
  connections: (slug: string = ENTERPRISE_SLUG) =>
    `/org/${slug}/settings/connections?tab=integrations`,

  /** Sub-org settings root. */
  settingsRoot: (slug: string = TEST_SUBORG) => `/org/${slug}/settings`,

  /** Sub-org secrets page. */
  secrets: (slug: string = TEST_SUBORG) => `/org/${slug}/settings/secrets`,

  /** Enterprise guardrails page. */
  guardrails: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/guardrails`,

  /** Organizations list page. */
  organizations: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/organizations`,

  /** Create organization form. */
  orgCreate: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/organizations/create`,

  /** Enterprise Devin settings page. */
  devinSettings: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/enterprise-devin`,

  /** Enterprise environment page, optionally targeting a tab. */
  environment: (slug: string = ENTERPRISE_SLUG, tab?: string) =>
    `/org/${slug}/settings/enterprise-environment${tab ? `?tab=${tab}` : ""}`,

  /** Devin Review landing (PR review UI). Sub-org sidebar → Review. */
  review: "/review",

  /** Build a Devin Review pull-request URL. */
  reviewPr: (owner: string, repo: string, number: number | string) =>
    `/review/${owner}/${repo}/pull/${number}`,

  /** Enterprise Devin Review settings page. */
  reviewSettings: (slug: string = ENTERPRISE_SLUG) => `/org/${slug}/settings/review`,

  /** Devin Review viewer for a specific merge/pull request. */
  reviewMergeRequest: (host: string, projectPath: string, iid: number) =>
    `/review/${host}/${projectPath}/-/merge_requests/${iid}`,

  /** Enterprise Membership page, optionally targeting a tab. */
  membership: (slug: string = ENTERPRISE_SLUG, tab?: "members" | "roles" | "groups") =>
    `/org/${slug}/settings/membership${tab ? `?tab=${tab}` : ""}`,

  /** Sub-org DeepWiki repository list. */
  wiki: (slug: string = TEST_SUBORG) => `/org/${slug}/wiki`,

  /** A repo's DeepWiki page. */
  repoWiki: (owner: string, repo: string, slug: string = TEST_SUBORG) =>
    `/org/${slug}/wiki/${owner}/${repo}`,
} as const;
