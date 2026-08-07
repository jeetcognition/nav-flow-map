// Incidents — pattern-first triage (QA-DEC-027). Structure borrowed from the
// pylon-report-parser report (view rail + one ranked expandable list), skin is
// the app's own tokens. Default view: coverage gaps (the money question).
import { useMemo, useState, type ReactNode } from "react";
import {
  Fire,
  HandPalm,
  Rows,
  CheckCircle,
  Prohibit,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { escapedDefects, getIncidents, getPatterns } from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { EmptyState } from "../components/ui/EmptyState";
import { CreateTestcaseModal } from "../components/incidents/CreateTestcaseModal";
import { PatternCard } from "../components/incidents/PatternCard";
import { SurfaceChips } from "../components/incidents/SurfaceChips";
import { VerifyQueue } from "../components/incidents/VerifyQueue";
import { pct } from "../lib/format";
import type { Incident, Pattern, SurfaceId } from "../types";
import "../styles/incidents.css";

type ViewId = "gaps" | "verify" | "all" | "wins" | "noise";

interface ViewMeta {
  id: ViewId;
  label: string;
  icon: ReactNode;
  sub: string;
}

// non-empty tuple, same convention as SURFACES in fixtures/static.ts
const VIEWS: [ViewMeta, ...ViewMeta[]] = [
  {
    id: "gaps",
    label: "Coverage gaps",
    icon: <Fire size={15} weight="duotone" />,
    sub: "what customers hit that we have no test for — ranked by impact × growth",
  },
  {
    id: "verify",
    label: "Verify queue",
    icon: <HandPalm size={15} weight="duotone" />,
    sub: "the AI wasn't sure — your verdict trains tomorrow's classifier",
  },
  {
    id: "all",
    label: "All patterns",
    icon: <Rows size={15} weight="duotone" />,
    sub: "every pattern, including covered and dismissed",
  },
  {
    id: "wins",
    label: "Covered wins",
    icon: <CheckCircle size={15} weight="duotone" />,
    sub: "patterns that stopped hurting because a test now guards them",
  },
  {
    id: "noise",
    label: "Dismissed noise",
    icon: <Prohibit size={15} weight="duotone" />,
    sub: "ruled out by a human — audited here, never resurfaces",
  },
];

function matchesSearch(p: Pattern, q: string): boolean {
  const hay = `${p.label} ${p.flow}`.toLowerCase();
  return hay.includes(q);
}

export default function Incidents() {
  useDataVersion();
  const [view, setView] = useState<ViewId>("gaps");
  const [query, setQuery] = useState("");
  const [growingFirst, setGrowingFirst] = useState(true);
  const [offSurfaces, setOffSurfaces] = useState<Set<SurfaceId>>(new Set());
  const [modalIncident, setModalIncident] = useState<Incident | null>(null);

  const incidents = getIncidents();
  const patterns = getPatterns();

  const verifyQueue = incidents.filter((i) => i.verdict === "possible-bug" && !i.humanCategory);
  const gaps = patterns.filter((p) => p.coverage === "uncovered" || p.coverage === "weak");
  const wins = patterns.filter((p) => p.coverage === "covered" || p.coverage === "weak");
  const noise = patterns.filter((p) => p.coverage === "dismissed");
  const coveredPct = pct(
    patterns.filter((p) => p.coverage === "covered").length,
    patterns.length || 1,
  );
  const judgedToday = incidents.filter(
    (i) => Date.now() - new Date(i.createdAt).getTime() < 24 * 3600e3,
  ).length;

  const surfaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of patterns) counts[p.surfaceId] = (counts[p.surfaceId] ?? 0) + 1;
    return counts;
  }, [patterns]);
  const activeSurfaces = new Set(
    (Object.keys(surfaceCounts) as SurfaceId[]).filter((s) => !offSurfaces.has(s)),
  );

  const q = query.trim().toLowerCase();
  const visible = (list: Pattern[]) => {
    const filtered = list
      .filter((p) => activeSurfaces.has(p.surfaceId))
      .filter((p) => !q || matchesSearch(p, q));
    return growingFirst
      ? [...filtered].sort((a, b) => b.growth24h - a.growth24h || b.score - a.score)
      : filtered;
  };

  const meta = VIEWS.find((v) => v.id === view) ?? VIEWS[0];
  const counts: Record<ViewId, number> = {
    gaps: gaps.length,
    verify: verifyQueue.length,
    all: patterns.length,
    wins: wins.length,
    noise: noise.length,
  };

  const renderPatterns = (list: Pattern[], emptyHint: string) => {
    const shown = visible(list);
    if (shown.length === 0)
      return (
        <EmptyState
          icon={<Fire size={28} weight="duotone" />}
          title="Nothing here"
          hint={emptyHint}
        />
      );
    return (
      <div className="pat-list">
        {shown.map((p, i) => (
          <PatternCard key={p.id} pattern={p} index={i} onCreateTestcase={setModalIncident} />
        ))}
      </div>
    );
  };

  return (
    <div className="page inc-page">
      <aside className="inc-rail" aria-label="Incident views">
        <div className="inc-rail-title">Incidents</div>
        <nav>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={`inc-rail-item ${view === v.id ? "active" : ""}`}
              onClick={() => setView(v.id)}
              aria-current={view === v.id}
            >
              {v.icon} {v.label}
              <span className={`inc-rail-count num ${v.id === "gaps" ? "hot" : ""}`}>
                {counts[v.id]}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="inc-main">
        <div className="inc-title-row">
          <div>
            <h1 className="page-title">{meta.label}</h1>
            <p className="page-sub">{meta.sub}</p>
          </div>
          <SurfaceChips
            counts={surfaceCounts}
            active={activeSurfaces}
            onToggle={(id) =>
              setOffSurfaces((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
        </div>

        <div className="inc-digest" aria-label="Today's digest">
          <div className="inc-stat">
            <div className="v num">{judgedToday}</div>
            <div className="l">tickets judged today</div>
          </div>
          <div className="inc-stat">
            <div className="v num">{gaps.length}</div>
            <div className="l">open coverage gaps</div>
          </div>
          <div className="inc-stat">
            <div className="v num warn">{verifyQueue.length}</div>
            <div className="l">awaiting your verdict</div>
          </div>
          <div className="inc-stat">
            <div className="v num ok">{coveredPct}%</div>
            <div className="l">patterns covered</div>
          </div>
          <div className="inc-stat">
            <div className="v num">{escapedDefects().length}</div>
            <div className="l">escaped defects</div>
          </div>
        </div>

        {view !== "verify" && (
          <div className="inc-tools">
            <label className="inc-search">
              <MagnifyingGlass size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patterns, flows…"
                aria-label="Search patterns"
              />
            </label>
            <button
              className={`inc-toggle ${growingFirst ? "on" : ""}`}
              onClick={() => setGrowingFirst((g) => !g)}
              aria-pressed={growingFirst}
            >
              Growing first
            </button>
          </div>
        )}

        {view === "gaps" &&
          renderPatterns(gaps, "No uncovered patterns match — the money question is answered.")}
        {view === "verify" &&
          (verifyQueue.length === 0 ? (
            <EmptyState
              icon={<HandPalm size={28} weight="duotone" />}
              title="Verify queue is clear"
              hint="No possible-bug incidents are waiting on a human verdict."
            />
          ) : (
            <VerifyQueue incidents={verifyQueue.filter((i) => activeSurfaces.has(i.surfaceId))} />
          ))}
        {view === "all" && renderPatterns(patterns, "No patterns match the current filters.")}
        {view === "wins" &&
          renderPatterns(wins, "No covered patterns yet — mark gaps covered as tests land.")}
        {view === "noise" && renderPatterns(noise, "Nothing dismissed yet.")}

        <CreateTestcaseModal incident={modalIncident} onClose={() => setModalIncident(null)} />
      </main>
    </div>
  );
}
