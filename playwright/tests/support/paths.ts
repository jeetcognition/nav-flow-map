// Central place for org slugs and URL builders so page objects/tests never hardcode paths.
//
// The enterprise (top-level) org and the sub-org under test are both env-configurable so the
// suite can point at staging/beta or a different test enterprise without touching code.

export const ENTERPRISE_SLUG = process.env.ENTERPRISE_SLUG ?? 'cog-enterprise-qa';
export const SUB_ORG = process.env.TEST_SUBORG ?? 'jeet-devin-qa';

/** Routes relative to BASE_URL (Playwright prepends baseURL automatically on page.goto). */
export const routes = {
  /** Enterprise landing / org-selector ("Choose an organization to continue"). */
  orgSelector: `/org/${ENTERPRISE_SLUG}/org-selector`,

  /** Sub-org home (Sessions). Pass a slug to target a specific sub-org. */
  sessions: (slug: string = SUB_ORG) => `/org/${slug}`,
  ask: (slug: string = SUB_ORG) => `/org/${slug}/search`,
  automations: (slug: string = SUB_ORG) => `/org/${slug}/automations`,
  review: (slug: string = SUB_ORG) => `/org/${slug}/review`,
  wiki: (slug: string = SUB_ORG) => `/org/${slug}/wiki`,
  settings: (slug: string = SUB_ORG) => `/org/${slug}/settings`,
} as const;
