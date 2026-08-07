"""Readable pattern headlines: cluster key → "user action → what breaks".

Ported from ent-qa/pylon-report-parser's `infer_user_flow` (the report never
shows raw cluster keys like "trace id: <id>" — it always renders this derived
sentence). Deterministic keyword cascade, no LLM; specific rules first, then
flow-aware rules, then cross-flow signals, then language-agnostic content
checks, then a per-flow fallback template.

The raw cluster key stays the pattern's IDENTITY (stable ids for the
coverage ledger); this module only decides what humans read.
"""
from __future__ import annotations

import re


def _has_word(word: str, s: str) -> bool:
    return bool(re.search(r"\b" + re.escape(word) + r"\b", s))


# Fallback sentences (the last `return` of each flow branch + the final ones).
# Upstream treats these as GENERIC: clusters sharing one of these do NOT tell
# the same story, so the engine must not merge them — and should append a
# distinguishing excerpt so rows don't render identically.
GENERIC_HEADLINES = frozenset({
    "Complete payment or plan change → account state not updated correctly",
    "Start a session → session unresponsive or fails to initialize",
    "Use Devin Review or GitHub integration → action fails",
    "Perform allowed action → unexpectedly denied (false permission block)",
    "Use AI coding features → incorrect output or feature unavailable",
    "Attempt to authenticate → login fails or session not established",
    "Run a CLI command → unexpected error or command hangs",
    "Upload or reference a file → file lost or inaccessible to the agent",
    "Check usage or consume credits → incorrect balance or quota mismatch",
    "Create new org or start first session → stuck in setup or fails to initialize",
    "Use the product normally → hits an unexpected error",
    "Perform a standard user action → unexpected failure",
})

_JUNK_KEYS = {"hello", "hi", "hey", "other", "bug", "error", "issue", "help", "urgent"}


def is_generic(h: str) -> bool:
    return h in GENERIC_HEADLINES


def excerpt(items: list[dict], key: str, flow: str, limit: int = 40) -> str:
    """Short distinguishing fragment for generic-headline clusters: the raw
    cluster key when it carries signal, else the top ticket's title/body.
    Returns "" when no candidate is human-readable (caller omits the quote)."""
    top = max(items, key=lambda r: r.get("_score", 0), default={})
    for cand in (key, top.get("title"), top.get("body_snippet")):
        s = (cand or "").strip()
        if len(s) < 8 or s.lower() in _JUNK_KEYS or s.lower() == flow.lower():
            continue
        s = re.sub(r"https?://\S+", "", s)
        s = re.sub(r"[\w.+-]+@[\w.-]+", "", s)  # emails would export as "•••@•••"
        s = re.sub(r"\[[^\]]*\]", " ", s)  # bracketed senders/tags
        # repeated / mangled mail-header prefixes: "Re: To: …", "o: Subject: …"
        s = re.sub(r"^(\W*(to|from|cc|re|fwd?|fw|subject|\w{1,2}):\s*)+", "", s, flags=re.I)
        s = re.sub(r"^\W*(hello|hi|hey|greetings|good (morning|afternoon|evening))\b[\s,!.]*", "", s, flags=re.I)
        s = re.sub(r"\s+", " ", s).strip(" .,;:-–—")
        if len(re.findall(r"[^\W\d_]", s)) < 6:  # fewer than six letters = junk
            continue
        if len(s) > limit:
            s = s[:limit].rsplit(" ", 1)[0].rstrip(" .,;:-–—") + "…"
        return s
    return ""


def headline(items: list[dict], flow: str, key: str) -> str:
    """items: cluster member tickets (title/body_snippet), flow: our flow
    name, key: the raw error-sig/normalized-title the cluster formed around."""
    t = " ".join(
        f"{r.get('title') or ''} {r.get('body_snippet') or ''}" for r in items[:8]
    ).lower()
    k = key.lower()

    # -- ultra-specific, unambiguous regardless of flow ----------------------
    if "err_connection_closed" in k or "connection_closed" in k:
        return "Use a session in the browser → connection drops unexpectedly"
    if "setting up" in k or "deciding action" in k:
        return 'Create new org → stuck in "Setting up" / "Deciding action" loop'
    if "browser" in k and "crash" in k:
        return "Start a session → browser crashes during initialization"

    # -- flow-aware ----------------------------------------------------------
    if flow == "Billing/Account":
        if "payment failed" in k or ("payment" in k and "fail" in k):
            return "Attempt payment → payment fails or card declined"
        if "payment" in k and ("pro" in t or "activated" in t or "plan" in t):
            return "Pay for a plan → plan features not activated despite successful payment"
        if "subscription" in k and ("unpaid" in k or "invoice" in k):
            return "Change subscription → blocked by unpaid invoices or stale billing state"
        if "seat" in k and ("allocated" in k or "no seat" in k):
            return 'Activate plan → admin shows "No seat allocated" despite active subscription'
        if "upgrade" in k or "downgrade" in k:
            return "Attempt plan change (upgrade/downgrade) → action fails or state inconsistent"
        if "charge" in k or "invoice" in k or "refund" in k:
            return "Review billing → unexpected charges or invoice discrepancies"
        if "usage" in k or "credit" in k:
            return "Buy or track usage/credits → purchase not reflected in account"
        return "Complete payment or plan change → account state not updated correctly"

    if flow == "Sessions/Automation":
        if "schedule" in k and ("not run" in k or "did not run" in k or "not trigger" in k):
            return "Configure scheduled task → schedule fails to trigger at expected time"
        if "schedule" in k:
            return "Set up scheduled automation → schedule misconfigures or fails to execute"
        if "automation" in k or "external api" in k:
            return "Run automated workflow with external APIs → sandbox blocks outbound access"
        if "session" in k and "not showing" in k:
            return "Complete a session → session missing from session list / history"
        if "session" in k and ("crash" in k or "fail" in k or "disappear" in k):
            return "Run a session → session crashes, fails, or disappears"
        if "workspace" in k:
            return "Open workspace → workspace fails to load or loses state"
        if "403" in k or "permission" in k:
            return "Start or resume a session → blocked by a false permission error"
        return "Start a session → session unresponsive or fails to initialize"

    if flow == "Review/GitHub":
        if "devin review" in k and ("auto" in k or "trigger" in k or "not review" in k):
            return "Enable auto-review → PRs not getting reviewed automatically"
        if "devin review" in k:
            return "Use Devin Review → review fails or produces incorrect results"
        if "citation" in k or "link" in k:
            return "View review output → citation links broken or unclickable"
        if ("pr creation" in k or _has_word("pr", k)) and ("fail" in k or "error" in k):
            return "Create/review PR → GitHub integration fails or PR actions error"
        if "azure devops" in k:
            return "Use Azure DevOps → integration fails or PRs not synced"
        if "500" in k or "internal" in k:
            return "Use GitHub integration → request fails with a server error"
        return "Use Devin Review or GitHub integration → action fails"

    if flow == "Permissions/Rate limits":
        if "trace" in k or "internal error" in k:
            return 'Perform a normal operation → "Permission denied: internal error" with a trace ID'
        if "rate limit" in k and "message" in k:
            return "Send messages at normal pace → unexpectedly blocked by message rate limit"
        if "rate limit" in k or "high demand" in k or "demand for this model" in k:
            return "Use a model at normal pace → blocked by rate limit / high-demand throttle"
        return "Perform allowed action → unexpectedly denied (false permission block)"

    if flow == "IDE/Desktop":
        if "trace" in k:
            return 'Use the IDE normally → "Permission denied: internal error" with a trace ID'
        if "autocomplete" in k or "supercomplete" in k or "suggestion" in k:
            return "Type code → autocomplete suggestions flicker, disappear, or fail to appear"
        if "cascade" in k and ("context" in k or "conversation" in t):
            return "Send multiple messages in Cascade → AI loses context from earlier turns"
        if "model" in k and ("select" in k or "switch" in k):
            return "Switch AI model in the IDE → selector fails or model unavailable"
        if "freeze" in k or "crash" in k or "freezes" in t:
            return "Use the IDE → editor freezes, crashes, or loses the conversation"
        if "intellij" in k or "android studio" in k or "plugin" in k:
            return "Use the IDE plugin → plugin crashes or fails to connect"
        return "Use AI coding features → incorrect output or feature unavailable"

    if flow == "Login/Auth":
        if "sso" in k or "saml" in k:
            return "Attempt SSO login → authentication fails or redirect loop"
        if "otp" in k or "verification code" in k or "2fa" in k:
            return "Enter the emailed verification code → code rejected or never arrives"
        if "trace" in k:
            return 'Attempt to sign in → "Permission denied: internal error" with a trace ID'
        return "Attempt to authenticate → login fails or session not established"

    if flow == "CLI":
        if "install" in k or "first run" in k:
            return "Install the CLI fresh → first run hangs or crashes before becoming usable"
        if "hang" in k or "stuck" in k:
            return "Run a CLI command → CLI hangs or becomes unresponsive"
        if "trace" in k or "permission" in k:
            return "Run a CLI command → blocked by a false permission error with a trace ID"
        return "Run a CLI command → unexpected error or command hangs"

    if flow == "Files/Attachments":
        return "Upload or reference a file → file lost or inaccessible to the agent"

    if flow == "Quota/Usage":
        if "not" in k and ("consumed" in k or "quota" in k):
            return "Use plan features → plan quota not consumed, on-demand credits charged instead"
        if "credit" in k or "acu" in k:
            return "Check usage/credits → incorrect balance shown or credits not applied"
        return "Check usage or consume credits → incorrect balance or quota mismatch"

    if flow == "Onboarding/Setup":
        if "install" in k or "first run" in k:
            return "Install fresh → first run hangs or crashes before becoming usable"
        return "Create new org or start first session → stuck in setup or fails to initialize"

    # -- cross-flow signals ----------------------------------------------------
    if "hang" in k or "stuck" in k or "unresponsive" in k:
        return "Use the product normally → becomes stuck or unresponsive"
    if "byok" in t or "api key" in t:
        return "Configure a BYOK API key → model fails to respond or key not accepted"
    if "oauth" in k or _has_word("mcp", k):
        return "Set up an OAuth/MCP integration → credentials not accepted or connection fails"
    if "not showing" in k or "not appear" in k:
        return "Complete an action → result missing from the expected list/history"

    # -- language-agnostic content checks (non-English tickets) ---------------
    if any(w in t for w in ["payment", "charge", "billing", "оплат", "充值", "결제", "pago", "发票", "invoice"]):
        return "Attempt payment → payment page errors or transaction fails"
    if any(w in t for w in ["login", "sign in", "ingresar", "войти", "登录"]):
        return "Attempt to log in → authentication error or page fails to load"
    if any(w in t for w in ["error", "crash", "fail", "无法", "не работает"]):
        return "Use the product normally → hits an unexpected error"

    return "Perform a standard user action → unexpected failure"
