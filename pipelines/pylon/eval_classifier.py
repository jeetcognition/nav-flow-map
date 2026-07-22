"""Eval harness for ticket_classifier.py against labels/eval_set.json.

Gate for rule changes (QA-DEC-025): run before/after every edit to the RULES
table. Headline metrics exclude "unsure" labels. Prints misclassified ticket
numbers so the refiner can inspect them.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from ticket_classifier import classify

HERE = Path(__file__).parent


def load_labeled_rows():
    data = json.load(open(HERE / "labels" / "eval_set.json"))
    labels = {int(k): v for k, v in data["labels"].items()}
    conn = sqlite3.connect(HERE / "pylon_issues.db")
    conn.row_factory = sqlite3.Row
    rows = {r["number"]: dict(r) for r in conn.execute("SELECT * FROM issues") if r["number"] in labels}
    missing = set(labels) - set(rows)
    if missing:
        print(f"WARNING: {len(missing)} labeled tickets not in DB: {sorted(missing)[:5]}...")
    return labels, rows


def run(gate: bool = False) -> int:
    labels, rows = load_labeled_rows()
    tp = fp = fn = tn = 0
    def_tp = def_total = 0
    miss_fn, miss_fp = [], []
    unsure_verdicts = {"definite-bug": 0, "possible-bug": 0, "not-app-issue": 0}

    for num, row in rows.items():
        res = classify(row)
        pred_bug = res["verdict"] != "not-app-issue"
        lab = labels[num]
        if lab == "unsure":
            unsure_verdicts[res["verdict"]] += 1
            continue
        actual_bug = lab == "bug"
        if res["verdict"] == "definite-bug":
            def_total += 1
            def_tp += actual_bug
        if pred_bug and actual_bug:
            tp += 1
        elif pred_bug and not actual_bug:
            fp += 1
            miss_fp.append((num, res["score"], (row["title"] or "")[:70]))
        elif not pred_bug and actual_bug:
            fn += 1
            miss_fn.append((num, res["score"], (row["title"] or "")[:70]))
        else:
            tn += 1

    prec = tp / (tp + fp) if tp + fp else 0
    rec = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0
    print(f"scored {tp+fp+fn+tn} (excl. unsure): TP {tp}  FP {fp}  FN {fn}  TN {tn}")
    print(f"app-issue detection: precision {prec:.0%}  recall {rec:.0%}  F1 {f1:.2f}")
    if def_total:
        print(f"definite-bug band: {def_tp}/{def_total} labeled bug = {def_tp/def_total:.0%} precision")
    print(f"unsure tickets → {unsure_verdicts}")
    if miss_fn:
        print("\nFalse negatives (labeled bug, predicted not):")
        for n, s, t in sorted(miss_fn, key=lambda x: x[1]):
            print(f"  #{n} score={s:+.1f} {t}")
    if miss_fp:
        print("\nFalse positives (labeled not, predicted bug):")
        for n, s, t in sorted(miss_fp, key=lambda x: -x[1]):
            print(f"  #{n} score={s:+.1f} {t}")

    if gate:
        # Mechanical acceptance gate (REFINER.md): hard floors, not vibes.
        MIN_PRECISION, MIN_RECALL, MIN_DEF_PRECISION, MIN_SCORED = 0.90, 0.85, 0.95, 100
        failures = []
        if tp + fp + fn + tn < MIN_SCORED:
            failures.append(f"only {tp+fp+fn+tn} scored tickets (<{MIN_SCORED}) — eval set too thin in DB window")
        if prec < MIN_PRECISION:
            failures.append(f"precision {prec:.0%} < {MIN_PRECISION:.0%}")
        if rec < MIN_RECALL:
            failures.append(f"recall {rec:.0%} < {MIN_RECALL:.0%}")
        if def_total and def_tp / def_total < MIN_DEF_PRECISION:
            failures.append(f"definite-band precision {def_tp/def_total:.0%} < {MIN_DEF_PRECISION:.0%}")
        if failures:
            print("\nGATE FAILED:")
            for f in failures:
                print("  - " + f)
            return 1
        print("\nGATE PASSED")
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(run(gate="--gate" in sys.argv))
