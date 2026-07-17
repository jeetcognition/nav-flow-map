import { escapedDefects, getIncidents, getRuns, incidentCategory } from "../data/dataService";

export interface AttentionItem {
  id: string;
  icon: "run" | "fire" | "shield" | "ai" | "warn";
  text: string;
  cta: string;
  to: string;
  tone: "red" | "amber" | "purple";
}

/** Priority-ordered "what needs me now" queue, computed from live data. */
export function buildAttentionItems(): AttentionItem[] {
  const items: AttentionItem[] = [];

  const latest = [...getRuns()].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (latest && latest.failed > 0) {
    items.push({
      id: "failed-run",
      icon: "run",
      text: `Latest ${latest.suite} run failed — ${latest.failed} case${latest.failed > 1 ? "s" : ""} need review`,
      cta: "Review failures",
      to: `/runs/${latest.id}`,
      tone: "red",
    });
  }

  const s1 = getIncidents().filter((i) => i.severity === "S1" && i.status !== "resolved");
  if (s1.length > 0) {
    items.push({
      id: "s1-incidents",
      icon: "fire",
      text: `${s1.length} critical (S1) incident${s1.length > 1 ? "s" : ""} open`,
      cta: "Open incidents",
      to: "/incidents",
      tone: "red",
    });
  }

  const escaped = escapedDefects();
  if (escaped.length > 0) {
    items.push({
      id: "escaped",
      icon: "shield",
      text: `${escaped.length} escaped defect${escaped.length > 1 ? "s" : ""} — real bugs with no regression testcase yet`,
      cta: "Convert to testcases",
      to: "/incidents",
      tone: "amber",
    });
  }

  const needsReview = getIncidents().filter(
    (i) => incidentCategory(i) === "unknown" && i.status !== "resolved"
  );
  if (needsReview.length > 0) {
    items.push({
      id: "ai-review",
      icon: "ai",
      text: `${needsReview.length} incident${needsReview.length > 1 ? "s" : ""} the AI couldn't classify — needs a human call`,
      cta: "Triage now",
      to: "/incidents",
      tone: "purple",
    });
  }

  return items.slice(0, 4);
}
