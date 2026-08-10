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
check("suggested-test-flow", "20 standard actions" in big["suggestedTest"], big["suggestedTest"])

pats2 = build_patterns(same + other, now=NOW)
check("deterministic-ids", {p["id"] for p in pats} == {p["id"] for p in pats2})

print("detect_surface() — product beats inbox brand (parser bucket() parity)")
check("cli-beats-devin-brand",
      classify(t("Devin CLI error after reinstall", brand="Devin"))["surface"] == "devin-cli")
check("cli-beats-windsurf-brand",
      classify(t("Users report they lost access to the CLI", brand="Windsurf"))["surface"] == "devin-cli")
check("cascade-is-windsurf",
      classify(t("At @ symbol button closes cascade window", brand="Devin"))["surface"] == "windsurf")
check("windsurf-brand-sticks",
      classify(t("Editor theme renders wrong colors", brand="windsurf_eu"))["surface"] == "windsurf")
check("ide-needs-word-boundary",
      classify(t("please provide the sidebar video", brand="Devin"))["surface"] != "windsurf")
check("integrated-terminal-stays-ide",
      classify(t("At @ symbol button closes cascade window",
                 body="clicking the @ symbol from a terminal window closes my cascade panel",
                 brand="Fedramp"))["surface"] == "windsurf")
check("bare-terminal-still-cli",
      classify(t("Crashes on multi-file pasteboard drop in the terminal", brand="Devin"))["surface"] == "devin-cli")
check("ent-plan-wins",
      classify({**t("billing question", brand="Devin"), "plan_tier": "enterprise"})["surface"] == "enterprise")
check("ent-identity-beats-quoted-docs-link",
      classify({**t("Devin SSO setup",
                    body="on an enterprise plan; your docs say go to windsurf.com/team/settings to configure saml",
                    brand="Devin"), "plan_tier": "enterprise"})["surface"] == "enterprise")
check("fedramp-is-enterprise",
      classify(t("cannot access our fedramp instance", brand=""))["surface"] == "enterprise")
check("devin-brand-is-retail",
      classify(t("payment not reflected in my account", brand="Devin"))["surface"] == "retail")
check("unknown-defaults-enterprise",
      classify(t("random unrelated note", brand=""))["surface"] == "enterprise")

print("display_title() — readable incident titles")
from export_incidents import display_title

check("generic-title-uses-body",
      "quota" in display_title({"title": "Hello", "body_snippet": "Hello team. My quota resets but credits are still not applied to the account."}).lower(),
      display_title({"title": "Hello", "body_snippet": "Hello team. My quota resets but credits are still not applied to the account."}))
check("strips-urls", "http" not in display_title({"title": "Login fails at https://example.com/callback?code=x every time"}))
check("strips-uuid", "9f8b" not in display_title({"title": "Session 9f8b1c2d-1111-2222-3333-444455556666 crashes on start"}))
long_title = {"title": "I noticed this morning credits are being charged so I am trying to use the model however what I am experiencing today is that everything hangs"}
dt_out = display_title(long_title)
check("word-boundary-ellipsis", dt_out.endswith("…") and " " not in dt_out[-12:-1].split()[-1], dt_out)
check("caps-normalized", display_title({"title": "PAYMENT PAGE IS BROKEN"}) == "Payment page is broken")
check("empty-falls-back", display_title({"title": "", "body_snippet": "", "number": 42}) == "Pylon ticket #42")
masked = display_title({"title": "To: user@example.com",
                        "body_snippet": "The CLI login fails with a 403 error every single time."})
check("masked-title-uses-body", "cli login fails" in masked.lower(), masked)
check("masked-title-no-remnant", "•••" not in masked, masked)

from pattern_headlines import excerpt
check("excerpt-skips-masked-email",
      excerpt([{"title": "To: user@example.com", "_score": 1}], "o", "CLI") == "")
check("excerpt-falls-to-title",
      "quota" in excerpt([{"title": "Quota resets but balance is wrong", "_score": 1}], "o", "CLI").lower())

print("headline() — pattern labels read as user-action → failure")
from pattern_headlines import headline

check("trace-id-readable",
      "trace id" in headline([t("Permission denied: internal error")], "Permissions/Rate limits", "trace id: <id>").lower())
check("rate-limit-readable",
      headline([], "Permissions/Rate limits", "permission denied: reached message rate limit").startswith("Send messages"))
check("billing-refid-readable",
      "→" in headline([t("发票问题 ORFVDYCI-0011")], "Billing/Account", "orfvdyci-0011"))
check("fallback-has-arrow", "→" in headline([], "Other", "zzz"))

# same story told by two different keys in one surface+flow → one pattern
dupes = [pt(21, "Permission denied: reached message rate limit for the model"),
         pt(22, "permission denied — message rate limit reached", body="ERR_LIMIT trace"),
         pt(23, "Rate limited on messages again", body="permission denied: reached message rate limit")]
merged_pats = build_patterns(dupes, now=NOW)
check("same-headline-merges", len(merged_pats) == 1, f"expected 1 pattern, got {len(merged_pats)}")
check("labels-are-headlines", all("→" in p["label"] for p in build_patterns(same + other, now=NOW)))

# clusters that only share a GENERIC fallback headline stay separate, with a
# distinguishing excerpt so the rows never render identically
gen = [pt(31, "Cascade behaving weird lately", body="output looks wrong"),
       pt(32, "Windsurf theme odd colors", body="colors render wrong")]
gen_pats = build_patterns(gen, now=NOW)
check("generic-not-merged", len(gen_pats) == 2, f"expected 2 patterns, got {len(gen_pats)}")
check("generic-labels-distinct", len({p["label"] for p in gen_pats}) == 2,
      str([p["label"] for p in gen_pats]))
check("generic-label-has-excerpt", all("“" in p["label"] for p in gen_pats),
      str([p["label"] for p in gen_pats]))

print("suggest_test() + trend + priority reason (parser gap-card parity)")
from pattern_tests import suggest_test

check("review-fallback-exact",
      suggest_test([], "Review/GitHub", "zzz", "windsurf")
      == "Create PR via Devin session → verify PR appears on GitHub → verify review comments can be posted")
check("schedule-specific",
      "scheduled task" in suggest_test([], "Sessions/Automation", "schedule did not run", "enterprise"))
check("trace-specific",
      "Permission denied: internal error" in suggest_test([], "Permissions/Rate limits", "trace id: <id>", "enterprise"))
check("other-reproduces-headline",
      suggest_test([], "Other", "zzz", "retail").startswith("Reproduce: "))

# trend + priority reason are derived per pattern from the window
lone = build_patterns([pt(41, "Upload attachment fails with corrupt file", hours_ago=2)], now=NOW)[0]
check("new-trend", lone["trend"] == "new", lone["trend"])
check("new-reason", "new pattern" in lone["priorityReason"], lone["priorityReason"])
accel_items = ([pt(50 + i, "Permission denied: reached message rate limit", hours_ago=24 * 2 + i) for i in range(4)]
               + [pt(60, "permission denied: reached message rate limit again", hours_ago=24 * 10)])
accel = build_patterns(accel_items, now=NOW)[0]
check("accelerating-trend", accel["trend"] == "accelerating", accel["trend"])
check("count14d-derived", accel["count14d"] == 5, str(accel["count14d"]))
quiet = build_patterns([pt(70, "Upload attachment fails badly", hours_ago=24 * 12),
                        pt(71, "upload attachment fails badly again", hours_ago=24 * 13)], now=NOW)[0]
check("emerging-fallback", quiet["priorityReason"] == "emerging pattern", quiet["priorityReason"])

print("pending verdicts + coverage ledger — the worker→pipeline contract (QA-DEC-028)")
import tempfile
from pathlib import Path

import pattern_engine
from export_incidents import load_pending_verdicts

with tempfile.TemporaryDirectory() as td:
    pend = Path(td) / "pending_verdicts.json"
    pend.write_text(json.dumps({
        "61158": {"category": "app-bug", "by": "u-jeet", "at": "2026-08-07T12:00:00Z"},
        "53476": {"category": "customer-doubt", "by": "u-maya", "at": "2026-08-07T12:00:00Z"},
        "99999": {"category": "invented-category", "by": "u-x", "at": ""},
        "88888": "not-a-dict",
    }))
    loaded = load_pending_verdicts(pend)
    check("pending-valid-kept", set(loaded) == {"61158", "53476"}, str(set(loaded)))
    check("pending-category-passthrough", loaded["61158"]["category"] == "app-bug")

    bad = Path(td) / "broken.json"
    bad.write_text("{not json")
    check("pending-malformed-fails-open", load_pending_verdicts(bad) == {})
    check("pending-missing-fails-open", load_pending_verdicts(Path(td) / "nope.json") == {})

    cov = Path(td) / "coverage.json"
    cov.write_text(json.dumps({
        "a1b2c3d4e5f6": {"status": "covered", "coveredBy": "ENT-REG12",
                          "by": "u-jeet", "updatedAt": "2026-08-07T12:00:00Z"},
        "ffffffffffff": {"status": "wat"},
    }))
    orig_cov_path = pattern_engine.COVERAGE_PATH
    pattern_engine.COVERAGE_PATH = cov
    try:
        ledger = pattern_engine.load_coverage()
    finally:
        pattern_engine.COVERAGE_PATH = orig_cov_path
    check("coverage-worker-shape-accepted", ledger.get("a1b2c3d4e5f6", {}).get("coveredBy") == "ENT-REG12")
    check("coverage-bad-status-dropped", "ffffffffffff" not in ledger)

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
