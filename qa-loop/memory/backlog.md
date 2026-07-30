# Backlog — parked / blocked test ideas

Tests too deep, expensive, or blocked for a normal run. Pull an item into an
actual catalog case (and `testcases.json`) when the blocker clears. Record WHY
it is parked so a future run knows what unblocks it.

| ID     | Area          | Idea                                                | Why parked                           |
| ------ | ------------- | --------------------------------------------------- | ------------------------------------ |
| BL-001 | Auth          | SSO / SAML end-to-end                               | Needs an IdP test account            |
| BL-002 | Git / ADO     | Azure DevOps manual webhook configure step          | Needs ADO org access                 |
| BL-003 | Permissions   | Cross-org leak under concurrent sessions            | Needs two full org setups            |
| BL-004 | ACU           | ACU limit enforcement at exact boundary (N-1/N/N+1) | Needs billing test env               |
| BL-005 | Org / Invites | Invite expiry — works before TTL, fails after       | Long-running (TTL wait)              |
| BL-006 | Billing       | Customer-billed ACU delta correctness               | Not UI-testable; needs source + data |

<!-- Template: | BL-NNN | Area | Idea | Why parked | -->
