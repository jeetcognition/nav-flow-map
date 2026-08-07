"""Unit tests for the intake pipeline — runnable with plain `python3
test_pipeline.py` (no test framework dependency; CI runs it on every PR).

All ticket text here is SYNTHETIC. Never paste real customer content into
this file — it is committed to a public repo.
"""
from __future__ import annotations

import json
import re

from export_incidents import draft_testcase, map_node, sanitize, state_to_status
from ticket_classifier import classify

FAILURES: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    if not cond:
        FAILURES.append(f"{name}: {detail}")
        print(f"  FAIL {name} {detail}")
    else:
        print(f"  ok   {name}")


def t(title: str, body: str = "", qtype: str = "", priority: str = "", brand: str = "Devin") -> dict:
    return {
        "title": title,
        "body_snippet": body,
        "question_type": qtype,
        "priority": priority,
        "brand": brand,
        "tags": "[]",
    }


print("sanitize() — PII boundary")
s = sanitize("[someone@example.com] Cannot open https://app.devin.ai/org/acme-corp/settings page")
check("strips-bracket-sender", "someone" not in s, s)
check("masks-email", "@example.com" not in s, s)
check("masks-org-slug", "acme-corp" not in s and "app.devin.ai/org/•••" in s, s)
s = sanitize("see https://app.devin.ai/sessions/abc123def and https://acme.devinenterprise.com/login")
check("masks-session-id", "abc123def" not in s, s)
check("masks-enterprise-host", "acme.devinenterprise.com" not in s, s)
s = sanitize("call me at +1 (415) 555-0100 thanks")
check("masks-phone", "555" not in s, s)
s = sanitize("The button is broken [Agent] Have you tried turning it off? [user@x.io] yes")
check("drops-agent-turns", "[Agent]" not in s and "turning it off" not in s, s)
check("keeps-user-text", "button is broken" in s, s)
s = sanitize("can&#x27;t save &quot;profile&quot;")
check("unescapes-html", "can't" in s and '"profile"' in s, s)

print("map_node()")
check("login", map_node("cannot log in via sso redirect")[0] == "login")
check("auth-otp", map_node("verification code not accepted")[0] == "auth")
check("review", map_node("pull request review stuck")[0] == "review")
check("fallback", map_node("something entirely unrelated")[0] == "landing")
check("fallback-flagged", map_node("something entirely unrelated")[1] is False)

print("state_to_status()")
check("new-open", state_to_status("new") == "open")
check("woc-investigating", state_to_status("waiting_on_customer") == "investigating")
check("closed-resolved", state_to_status("closed") == "resolved")

print("classify() — verdict bands on synthetic tickets")
r = classify(t("Bug report: saving settings throws 500 internal error every time",
               "Steps to reproduce: open settings, click save. Error: internal exception. It worked before the update.",
               qtype="bug", priority="high"))
check("hard-bug-definite", r["verdict"] == "definite-bug", str(r["score"]))
check("confidence-range", 0 < r["confidence"] <= 1)
check("severity-high-s2", r["severity"] == "S2", r["severity"])

r = classify(t("Payment Failed - Action Required", "We weren't able to charge the card", qtype="question"))
check("dunning-not", r["verdict"] == "not-app-issue", str(r["score"]))
r = classify(t("Please delete my account and all data", "GDPR request", qtype="bug"))
check("delete-account-not", r["verdict"] == "not-app-issue", str(r["score"]))
r = classify(t("Automatic reply: Updated Terms of Service", "I am out of office until Monday"))
check("auto-reply-not", r["verdict"] == "not-app-issue", str(r["score"]))
r = classify(t("I paid for Pro but my account still shows free plan", qtype="question"))
check("entitlement-possible+", r["verdict"] != "not-app-issue", str(r["score"]))
r = classify(t("How do I configure the linter?", "Is it possible to use a custom config?", qtype="question"))
check("howto-not", r["verdict"] == "not-app-issue", str(r["score"]))
r = classify(t("", ""))
check("empty-not", r["verdict"] == "not-app-issue", str(r["score"]))
check("brand-surface", classify(t("x", brand="Windsurf"))["surface"] == "windsurf")
check("reasons-explain", len(classify(t("error crash bug", qtype="bug"))["reasons"]) >= 2)

print("draft_testcase()")
d = draft_testcase("Login broken", "user cannot log in", "login")
check("draft-fields", all(k in d for k in ("title", "nodeId", "priority", "preconditions", "steps", "expected")))

print("leak property — sanitize then serialize never leaks an email")
nasty = [
    "plain user.name+tag@sub.domain.co.uk in text",
    "[a@b.io] [c@d.io] doubled senders a@b.io again",
    "email in url https://x.com/?email=leak@corp.com&x=1",
]
for n in nasty:
    out = json.dumps(sanitize(n))
    check("no-email-leak", not re.search(r"[\w.+-]+@[\w-]+\.\w", out.replace("•••@•••", "")), out)


print("pattern_engine — clustering, ranking, coverage join (QA-DEC-027)")
from datetime import datetime, timedelta, timezone

from pattern_engine import build_patterns, error_sig, flow_of

NOW = datetime(2026, 8, 7, 12, 0, tzinfo=timezone.utc)


def pt(num: int, title: str, body: str = "", hours_ago: int = 1, state: str = "new",
       verdict: str = "definite-bug", surface: str = "enterprise", score: float = 5.0) -> dict:
    return {
        "id": f"id-{num}", "number": num, "title": title, "body_snippet": body,
        "state": state, "link": f"https://x.pylon/{num}",
        "created_at": (NOW - timedelta(hours=hours_ago)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_verdict": verdict, "_surface": surface, "_score": score,
    }


check("flow-best-match", flow_of({"title": "devin review pull request broken", "body_snippet": ""}) == "Review/GitHub")
check("flow-fallback", flow_of({"title": "zzz qqq", "body_snippet": ""}) == "Other")
check("sig-language-free", error_sig({"title": "账单编号：ORFVDYCI-0011 发票不对", "body_snippet": ""}) != "", "ref ids match in any language")

same = [pt(1, "Permission denied: reached message rate limit"),
        pt(2, "permission denied — reached message rate limit again"),
        pt(3, "Rate limit: permission denied reached for message", hours_ago=30)]
other = [pt(9, "Upload attachment fails with corrupt file", hours_ago=2)]
pats = build_patterns(same + other, now=NOW)
check("clusters-merge", len(pats) == 2, f"expected 2 clusters, got {len(pats)}")
big = max(pats, key=lambda p: p["total"])
check("cluster-size", big["total"] == 3, str(big["total"]))
check("growth-derived", big["count24h"] == 2 and big["growth24h"] == 1,
      f"24h={big['count24h']} growth={big['growth24h']}")
check("first-seen-derived", big["firstSeen"] == (NOW - timedelta(hours=30)).strftime("%Y-%m-%dT%H:%M:%SZ"))
check("rank-order", pats[0] is big, "bigger cluster must rank first")
check("stable-id", len(big["id"]) == 12)
check("default-uncovered", all(p["coverage"] == "uncovered" for p in pats))
check("suggested-test-flow", "20 standard user actions" in big["suggestedTest"], big["suggestedTest"])

pats2 = build_patterns(same + other, now=NOW)
check("deterministic-ids", {p["id"] for p in pats} == {p["id"] for p in pats2})

print("read-only guard — the pipeline must NEVER write to Pylon")
import pathlib

WRITE_MARKERS = ['"-X"', '"--request"', '"-d"', '"--data"', '"--data-raw"', '"--form"',
                 "requests.post", "requests.put", "requests.delete", "requests.patch",
                 'method="POST"', "method='POST'", '"PUT"', '"POST"', '"DELETE"', '"PATCH"']
for f in sorted(pathlib.Path(__file__).parent.glob("*.py")):
    if f.name == "test_pipeline.py":  # the scanner itself contains the markers
        continue
    src = f.read_text()
    if "usepylon.com" not in src:
        continue
    check(f"pylon-api-only-in-fetcher ({f.name})", f.name == "fetcher.py",
          "only fetcher.py may call the Pylon API")
    for m in WRITE_MARKERS:
        check(f"no-write-marker {m} in {f.name}", m not in src)

print()
if FAILURES:
    print(f"{len(FAILURES)} FAILURES")
    raise SystemExit(1)
print("read-only guard passed")
