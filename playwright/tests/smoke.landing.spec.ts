import { test } from '@playwright/test';

// Scaffold for ENT-006 member propagation; skipped until a member flow is set up.

// Scaffold (intentionally skipped) for the higher-friction P0 propagation check.
// Needs an admin context AND a member context (two storageStates) + an invite/email path.
// Build this second, with Claude Code, once the landing smoke is green.
test.skip('invite member -> propagation visible to member [ENT-006]', async () => {
  // 1. (admin ctx) invite member to enterprise, no sub-org.
  // 2. (member ctx) verify enterprise access, no sub-org access.
  // 3. (admin ctx) add member to a sub-org.
  // 4. (member ctx) verify sub-org now accessible.
  // 5. (admin ctx) remove member; (member ctx) verify access revoked.
});
