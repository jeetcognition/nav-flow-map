# Expected behavior (the oracle)

Confirmed-correct behavior per surface. A deviation here is a **bug** (unless it
is listed in `known-quirks.md`). Keep entries observation-based; write
"needs verification" rather than inventing behavior you have not seen.

## Auth

- Admin login → org dashboard; no loading screen > 3s. Member login → member home, no admin UI.
- Bad credentials → stay on login with inline error, no 500.
- Session expiry → redirect to login with `?next=` preserved.

## Org / Members

- Bulk invite: all submitted emails receive an invite within ~2 min.
- Accepted invite → Active in Members list within one refresh.
- Role change takes effect on next page load; removing a member revokes the session within one login cycle.

## Git providers

- GitHub: OAuth connect → repo appears, webhook auto-registered (no "Configure webhook" button).
- GitLab / Azure DevOps: OAuth connect → repo appears, **manual** "Configure webhook" button (intended).

## Permissions

- Member hitting an admin-only URL → 403 or clean redirect to `/home`, never a 500.
- Admin-only actions are absent from a member session.

## Devin settings (`/settings/enterprise-devin`)

- Toggling a capability persists after reload and the composer honors it.
- Web-search toggle saves cleanly. (See BUG-015 for the Fusion-prerequisite regression.)

## API

- `GET /v2/enterprise/health/me` → 200 with `org_id`. `GET /v2/health/me` → 200 with `user_id`.
- Both → 401 unauthenticated (never 500 or 200-with-empty-body).

## Secure mode

- An admin in Org A cannot read/write/enumerate Org B resources; a member cannot disable secure mode.
