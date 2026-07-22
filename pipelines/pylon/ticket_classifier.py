"""Deterministic ticket classifier: is a Pylon ticket an application issue?

NO LLM at inference time (QA-DEC-025). Rules live in the RULES table below as
data (name, pattern, weight, scope) so the periodic LLM refiner edits weighted
patterns — never control flow. Every rule change must be validated with
eval_classifier.py against labels/eval_set.json before merging.

Input: a ticket dict with the columns of the `issues` SQLite table
(title, body_snippet, question_type, priority, tags, brand).
Output verdicts: "definite-bug" | "possible-bug" | "not-app-issue".
"""
from __future__ import annotations

import json
import math
import re

# ---------------------------------------------------------------------------
# Rule table. scope: where the pattern must match — "title" | "body" | "text"
# (title + body). Weights > 0 push toward app-issue, < 0 away from it.
# Initial weights authored from the 60-day corpus review (2026-07-22);
# tuned against labels/eval_set.json.
# ---------------------------------------------------------------------------
RULES: list[tuple[str, str, float, str]] = [
    # --- positive: hard error evidence ---
    ("http-error", r"\b(4\d\d|5\d\d)\b|\bhttp error\b", 1.6, "text"),
    ("error-word", r"\berror(s|ed)?\b|\bexception\b|\btraceback\b|\bstack trace\b", 1.4, "text"),
    ("crash", r"\bcrash(es|ed|ing)?\b|\bfroze(n)?\b|\bfreezes?\b|\bhang(s|ing)?\b|\bdisconnect(s|ed|ing)?\b|\blo[os]ses? (the |that )?connection\b", 1.5, "text"),
    ("stuck-loop", r"\bstuck\b|\binfinite(ly)?\b|\bspinning\b|\bkeeps? (loading|retrying|failing)\b", 1.4, "text"),
    ("failure-verb", r"\bfail(s|ed|ing)?( to)?\b|\bunable to\b|\bcannot\b|\bcan't\b|\bwon'?t\b", 1.1, "text"),
    ("not-working", r"\b(doesn'?t|does not|isn'?t|is not|stopped) work(ing)?\b|\bnot work(ing)?\b|\bbroken\b", 1.3, "text"),
    ("regression", r"\bregression\b|\bused to work\b|\bworked (before|previously|fine)\b|\b(after|since) (the |an? )?(update|upgrade|release)\b", 1.7, "text"),
    ("ui-glitch", r"\b(blank|empty) (page|screen|panel)\b|\bnot (showing|visible|displayed|rendering)\b|\bdisappear(s|ed)?\b|\bmissing (button|option|tab|menu)\b|\boverlap(s|ping)?\b|\btruncat(ed|es)\b", 1.4, "text"),
    ("invalid-state", r"\binvalid\b|\bincorrect(ly)?\b|\bwrong(ly)?\b|\bmismatch(ed)?\b|\bcorrupt(ed)?\b|\binconsistent\b", 1.0, "text"),
    ("denied-unexpected", r"\b(403|forbidden|permission denied|access denied|unauthorized)\b", 1.1, "text"),
    ("repro-evidence", r"\bsteps to reproduce\b|\brepro(duce|duction)?\b|\bscreenshot\b|\bscreen recording\b|\battached (video|log)\b", 0.7, "text"),
    ("bug-selfreport", r"\bbug\b|\bexperiencing\b|\breport(ing)? (an? )?(issue|problem|bug)\b", 1.0, "text"),

    # --- positive: families found in the 60-day review ---
    ("entitlement-gap", r"(paid|charged|purchased|bought|upgraded)[^.]{0,80}(still|but)[^.]{0,40}(free|not (active|upgraded|applied|working))|still (on|in|shows?(ing)? (as )?)(the )?free\b|showing (as )?free", 2.0, "text"),
    ("stuck-pending", r"\bpending (for|over|since)\b|\bstuck at\b|\bpayment processing\b|\bprocessing[^.]{0,30}(hour|day|stuck|forever)\b|\b(check again|try again)[^.]{0,30}(loop|again and again|every time)", 1.5, "text"),
    ("quota-metering", r"quota[^.]{0,40}(stuck|not reset|exceeded unexpectedly|also consumed|wrong)|limit[^.]{0,30}also consumed|(anomal\w*|abnormal|unexpected\w*)[^.]{0,25}(consum\w*|usage|charge\w*)|consumo an[oô]malo|charg(ed|ing)[^.]{0,25}(output )?tokens", 1.6, "text"),
    ("settings-revert", r"\brevert(s|ed|ing)?( back)? to\b|\bresets? (back )?to\b|\bdoesn'?t (stick|save|persist)\b|\bkeeps? (changing|resetting|switching)\b|\bautomatically (change[sd]?|switch(es|ed)?)\b", 1.4, "text"),
    ("data-loss", r"(lost|deleted|gone|wiped|disappeared|zerado|erased)[^.]{0,30}(session|history|organi[sz]ation|workspace|data)|(session|history|organi[sz]ation)s?[^.]{0,30}(lost|deleted|gone|wiped|disappeared)|hist[oó]rico zerado|locked out", 1.7, "text"),
    ("says-but", r"(says|shows|showing|displays|display)[^.]{0,60}\b(but|yet|even though|although)\b", 1.0, "text"),
    ("otp-failure", r"(not?|n'?t|never) receiv\w*[^.]{0,25}(code|otp|verification|email)|code (is )?not (accepted|working|received)|verification code[^.]{0,30}(invalid|not|error)", 1.6, "text"),
    ("nonenglish-broken", r"не работает|no funciona|não funciona|ne fonctionne pas|funktioniert nicht|çalışmıyor|不能用|无法(使用|登录|访问)|用不了|打不开|自动[^,。]{0,15}(改成|恢复|变成)|还是(显示|个人|我的名字)|为什么[^?？]{0,30}还是", 1.4, "text"),
    ("problem-statement", r"\bthe (problem|issue) is\b", 0.8, "text"),
    ("bug-report-doc", r"\bbug report\b|\bsteps?:\b|\bexpected( behavior| result)?:\b|\bactual( behavior| result)?:\b", 1.2, "text"),

    # --- negative: not-an-app-issue shapes ---
    ("how-to", r"\bhow (do|can|to|does|should)\b|\bis it (possible|reasonable)\b|\bcan i\b|\bwhat('s| is) the\b|\bclarif(y|ication)\b|\bguidance\b|\bbest practice\b|\bwould it be possible\b", -1.4, "text"),
    ("feature-ask", r"\bfeature request\b|\bplease (add|support|consider|enable)\b|\bwould be (nice|great|helpful|very helpful)\b|\bany plans?\b|\broadmap\b|\bsuggestion\b|\benhancement\b", -1.6, "text"),
    ("sales-meeting", r"\b(demo|meeting|pricing|quote|sales|partnership|procurement|startup program|contact (lead|sales))\b|\bschedul(e|ing)\b|\bpodcast\b|\bsummit\b|\bour (cto|ceo|founder)\b|\blet'?s connect\b|\bwould love to (connect|feature|chat)\b", -1.8, "text"),
    ("account-admin", r"\b(update|change|transfer) my (account )?(email|name|password)\b|\bmerge (accounts|orgs)\b|\bseats? (change|add|remove)\b", -1.5, "text"),
    ("delete-account", r"delete (my |the |this )?(whole |entire )?(windsurf |devin )?account|account deletion|remove my account|delete (everything|all|it)|permanently delete|\bgdpr\b|delete my (data|card)", -2.5, "text"),
    ("cancel-subscription", r"cancel (my |the |this )?(subscription|plan|account|payment)|stop my subscription|unsubscribe|disdire|退订|void (the )?(unpaid )?invoice", -1.8, "text"),
    ("billing-admin", r"\brefund\b|\bressarcimento\b|\bmoney back\b|\binvoice\b|\bbilling (question|cycle|date|specialist)\b|\b(upgrade|downgrade) (my )?(plan|subscription|account)\b|\bcredits? (usage|policy)\b|\bstudent (discount|team)\b|\bfree trial\b", -1.2, "text"),
    ("dunning-thread", r"payment failed - action required|payment to exafunction|was unsuccessful( again)?|receipt from exafunction|your receipt from", -2.5, "title"),
    ("dunning-body", r"failed-payments\+|invoice\+statements|stripe\.com|support@(windsurf|cognition)\.(com|ai) (wrote|escreveu|menulis|a écrit)", -1.5, "body"),
    ("auto-reply", r"^(automatic reply|automatische antwort|respuesta autom[aá]tica|resposta autom[aá]tica|r[eé]ponse automatique|自动回复|自動回復|自动答复|系统退信)", -3.0, "title"),
    ("out-of-office", r"out of (the )?office|annual leave|on vacation|business travel|maternity leave|no longer (work|have access)", -2.0, "body"),
    ("tos-thread", r"updated terms of service", -2.5, "title"),
    ("upload-only", r"^uploaded file: https?://", -2.5, "title"),
    ("mail-bounce", r"mail delivery|delayed \d+ hours|could not be processed|undeliver", -2.0, "text"),
    ("speak-human", r"(speak|talk) (with|to) (the )?(team|a human|someone|a real person)|live agent|real person|human agent", -1.8, "text"),
    ("request-received", r"^\[?request received\]?|we received your request|pylon wants your feedback", -2.0, "title"),
    ("complaint-meta", r"formal complaint|misconduct|escalat(e|ion)|no one has (contacted|responded)", -1.5, "text"),
    ("capacity-info", r"\bcapacity\b|\bforecast\b|\bquota increase\b|\blimit increase\b|\ballowlist\b|\bwhitelist\b", -0.9, "text"),
    ("praise-thanks", r"\bthank(s| you)\b.*\bgreat\b|\blove (the|this)\b|\bawesome\b|\bcongrat|\bpositive feedback\b|\braving about\b", -1.0, "text"),
]

# Pylon's own metadata as weak priors (noisy in both directions).
TYPE_WEIGHTS = {
    "bug": 1.6,
    "question": -0.6,
    "feature_request": -2.2,
    "meeting_scheduling": -2.6,
    "customer_love": -2.6,
    "user_error": -1.8,
    "": 0.0,
}
PRIORITY_WEIGHTS = {"urgent": 1.0, "high": 0.8, "medium": 0.1, "low": 0.0, "": 0.0}

# meeting_scheduling/customer_love occasionally hide real bug reports (WSL
# reconnect case in the eval set) — soften so strong error evidence can win.
TYPE_WEIGHTS["meeting_scheduling"] = -2.0

# Score thresholds for the verdict bands.
DEFINITE_AT = 4.0
POSSIBLE_AT = 1.3

BRAND_SURFACE = {
    "Devin": "enterprise",
    "Fedramp": "enterprise",
    "Windsurf": "windsurf",
    "windsurf_self_hosted_hybrid": "windsurf",
    "windsurf_eu": "windsurf",
}

SEV_BUMP = re.compile(
    r"\b(production|prod|outage|blocked|blocking|whole (org|team|company)|all users|every(one| user)|data loss|locked out|cannot log ?in)\b", re.I
)


def _text_fields(t: dict) -> tuple[str, str]:
    title = (t.get("title") or "").lower()
    body = (t.get("body_snippet") or "").lower()
    return title, body


def classify(ticket: dict) -> dict:
    """Classify one ticket. Returns verdict, confidence, score, fired rules,
    surface and severity hints."""
    title, body = _text_fields(ticket)
    text = f"{title}\n{body}"
    score = 0.0
    reasons: list[str] = []

    for name, pattern, weight, scope in RULES:
        hay = {"title": title, "body": body, "text": text}[scope]
        if re.search(pattern, hay, re.I):
            score += weight
            reasons.append(f"{'+' if weight > 0 else ''}{weight:.1f} {name}")

    qt = (ticket.get("question_type") or "").strip()
    tw = TYPE_WEIGHTS.get(qt, 0.0)
    if tw:
        score += tw
        reasons.append(f"{'+' if tw > 0 else ''}{tw:.1f} pylon-type:{qt}")

    pr = (ticket.get("priority") or "").strip()
    pw = PRIORITY_WEIGHTS.get(pr, 0.0)
    if pw:
        score += pw
        reasons.append(f"+{pw:.1f} priority:{pr}")

    if score >= DEFINITE_AT:
        verdict = "definite-bug"
    elif score >= POSSIBLE_AT:
        verdict = "possible-bug"
    else:
        verdict = "not-app-issue"

    # Confidence: distance from the nearest band edge, squashed to (0.5, 1).
    edge = min(abs(score - DEFINITE_AT), abs(score - POSSIBLE_AT))
    confidence = round(1 / (1 + math.exp(-edge)) , 2)

    sev = "S4"
    if pr == "urgent":
        sev = "S1"
    elif pr == "high":
        sev = "S2"
    elif pr == "medium":
        sev = "S3"
    if verdict != "not-app-issue" and SEV_BUMP.search(text):
        sev = {"S4": "S2", "S3": "S2", "S2": "S1", "S1": "S1"}[sev]

    return {
        "verdict": verdict,
        "confidence": confidence,
        "score": round(score, 2),
        "reasons": reasons,
        "surface": BRAND_SURFACE.get(ticket.get("brand") or "", "enterprise"),
        "severity": sev,
    }


if __name__ == "__main__":
    import sqlite3
    from collections import Counter

    conn = sqlite3.connect("pylon_issues.db")
    conn.row_factory = sqlite3.Row
    rows = [dict(r) for r in conn.execute("SELECT * FROM issues")]
    verdicts = Counter()
    for r in rows:
        verdicts[classify(r)["verdict"]] += 1
    total = sum(verdicts.values())
    print(f"{total} tickets → {dict(verdicts)}")
    for v in ("definite-bug", "possible-bug"):
        print(f"  {v}: {verdicts[v]} ({verdicts[v]/total:.0%})")
