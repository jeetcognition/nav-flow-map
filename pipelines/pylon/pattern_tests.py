"""Concrete suggested tests per pattern: cluster content → implementable steps.

Ported from ent-qa/pylon-report-parser's `suggest_test`. Same shape as its
report: every suggestion is a step chain ("do X → verify Y → verify Z") that
a QA engineer — or a Devin session — can implement without asking questions.
Specific label matches first, then a flow-appropriate default, then a
reproduce-the-headline fallback. Deterministic, no LLM.
"""
from __future__ import annotations

from pattern_headlines import headline

SURFACE_NAMES = {
    "enterprise": "Enterprise",
    "retail": "Devin",
    "windsurf": "Windsurf",
    "devin-cli": "CLI",
}


def suggest_test(items: list[dict], flow: str, key: str, surface: str) -> str:
    """items: cluster member tickets; flow: our flow name; key: raw cluster
    signature; surface: SurfaceId the cluster belongs to."""
    t = " ".join(
        f"{r.get('title') or ''} {r.get('body_snippet') or ''}" for r in items[:5]
    ).lower()
    k = key.lower()
    product = SURFACE_NAMES.get(surface, "Devin")

    # -- ultra-specific (unambiguous) -----------------------------------------
    if "context" in k and ("message" in k or "turn" in k):
        return "Open Cascade chat → send 12 sequential messages → verify turn 12 response references content from turns 1-3"
    if "auto-reload" in k or "auto reload" in k:
        return "Make code change in session → verify hot-reload triggers → verify preview updates without manual refresh"
    if "setting up" in k or "deciding action" in k:
        return 'Create new org → complete setup wizard → verify org transitions from "Setting up" to active within 60s'
    if "err_connection_closed" in k:
        return "Start a session → perform continuous work for 10 min → verify no ERR_CONNECTION_CLOSED → verify session reconnects if dropped"
    if "browser crash" in k:
        return "Start a session → verify browser starts without crash → interact for 2 min → verify stability"

    # -- flow-aware ------------------------------------------------------------
    if flow == "Billing/Account":
        if "payment failed" in k or ("payment" in k and "fail" in k):
            return "Attempt Stripe payment with valid test card → verify payment succeeds → attempt with declined card → verify clear error message"
        if "invoice" in k and ("setting" in k or "pr creation" in k):
            return 'Set "On PR creation" billing limit → trigger PR → verify charge does not exceed configured limit → check invoice matches settings'
        if "payment" in k or "plan" in k:
            return "Complete Stripe test payment for Pro plan → wait 30s → verify Pro features accessible → verify plan badge shows in UI"
        if "subscription" in k and ("unpaid" in k or "invoice" in k):
            return "Create account with overdue invoice state → attempt plan change → verify helpful error message (not cryptic trace ID)"
        if "seat" in k or "allocated" in k:
            return "Activate paid plan → verify seat allocated to admin → verify plan badge shows for all org members"
        if "access" in k and ("blocked" in k or "denied" in k):
            return "Activate paid plan → verify immediate access → wait 24h (simulate) → verify access persists without re-auth"
        if "usage" in k or "credit" in k:
            return "Buy extra usage/credits → verify balance updates within 60s → verify purchase reflected on the usage page and invoice"
        return "Navigate to Settings → Plans → complete plan change → verify account state updates within 30s → verify no stale billing state"

    if flow == "Sessions/Automation":
        if "schedule" in k:
            return "Create scheduled task for 5 min from now → wait → verify it triggers → verify output matches expected → check schedule history"
        if "automation" in k or "external api" in k:
            return "Start session with external API call → verify outbound HTTP works from sandbox → verify response is received"
        if "session" in k and "not showing" in k:
            return "Complete a session → navigate to Sessions list → verify session appears → verify metadata (title, timestamps) correct"
        if "session" in k and ("crash" in k or "fail" in k):
            return "Start 5 sessions in sequence → verify all start successfully → verify no crash within first 60s"
        return f"Start fresh {product} session → interact continuously for 5 min → verify response time stays under 5s throughout"

    if flow == "Permissions/Rate limits":
        if "trace" in k or "internal error" in k:
            return 'Perform 10 common operations (file edit, terminal, AI chat) → verify zero "Permission denied: internal error" responses'
        if "rate limit" in k or "high demand" in k:
            return "Perform 20 standard actions in 60s (normal user pace) → verify zero false rate-limit blocks → check error messages are clear"
        return "Authenticate as valid user → perform standard actions (edit, save, chat) → verify no false permission denials"

    if flow == "Review/GitHub":
        if "citation" in k or "link" in k:
            return "Open Devin Review on a PR → verify citation links are clickable → verify they scroll to correct code location"
        if "pr creation" in k:
            return "Ask Devin to create a PR → verify PR appears on GitHub → verify title/description/diff are correct"
        if "devin review" in k:
            return "Enable Devin Review on a repo → open PR → verify review comments appear within 5 min → verify comment quality"
        return "Create PR via Devin session → verify PR appears on GitHub → verify review comments can be posted"

    if flow == "IDE/Desktop":
        if "supercomplete" in k or ("suggestion" in k and "autocomplete" in t):
            return "Type partial code → wait 2s for suggestion → verify ghost text appears → do not dismiss for 3s → verify it stays stable"
        if "model" in k and ("select" in k or "switch" in k):
            return 'Open model selector → switch between 3 models → verify each responds correctly → verify no "model unavailable" errors'
        if "freeze" in k or "crash" in k:
            return "Open IDE → exercise chat + editing for 10 min → verify no freeze or crash → verify conversation history survives restart"
        return "Open IDE → start AI chat → send 5 messages → verify each gets valid response → verify no crashes or freezes"

    if flow == "Files/Attachments":
        return "Start session → upload 3 file types (txt, png, pdf) → reference each in prompt → verify agent can read all three"

    if flow == "Login/Auth":
        if "otp" in k or "verification code" in k:
            return "Request email verification code → verify it arrives within 60s → enter it → verify login completes"
        return "Attempt login via SSO/email → verify redirect completes → verify session established → verify no redirect loop"

    if flow == "CLI":
        if "install" in k or "first run" in k:
            return "Fresh install on clean machine → run first command → verify response within 10s → no crash/hang in first 60s"
        return "Run 10 common CLI commands → verify each responds correctly → verify no hangs or panics"

    if flow == "Quota/Usage":
        return "Check current ACU balance → run short session → re-check balance → verify deduction matches expected usage"

    if flow == "Onboarding/Setup":
        return 'Create new org → complete setup wizard → verify org transitions from "Setting up" to active within 60s'

    # -- generic fallback: reproduce the headline ------------------------------
    return f"Reproduce: {headline(items, flow, key)} — verify correct behavior end-to-end"
