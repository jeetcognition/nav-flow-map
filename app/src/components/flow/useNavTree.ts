// Tree state for the NavFlow graph: page list (base + edits), branch
// expand/collapse with persistence (old app behavior: first 4 layers open),
// the visible subtree, and the selection's parent chain.
import { useCallback, useEffect, useMemo, useState } from "react";
import { allPages } from "../../data/editsService";
import { useDataVersion } from "../../hooks/useData";
import { useEditsVersion } from "../../hooks/useEdits";
import { readStorage, writeStorage } from "../../lib/storage";
import type { NavNode } from "../../types";

const EXPANDED_KEY = "navflow-expanded-v1";
const DEFAULT_VISIBLE_LAYERS = 4;

function depthOf(page: NavNode, byId: Map<string, NavNode>): number {
  let d = 0;
  let cur = page;
  const seen = new Set<string>();
  while (cur.parent && byId.has(cur.parent) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parent)!;
    d++;
  }
  return d;
}

export function useNavTree(selectedId: string | null) {
  const dataVersion = useDataVersion();
  const editsVersion = useEditsVersion();

  const pages = useMemo(
    () => allPages(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataVersion, editsVersion],
  );
  const byId = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);
  const childrenOf = useMemo(() => {
    const m = new Map<string, NavNode[]>();
    for (const p of pages) {
      if (!p.parent || !byId.has(p.parent)) continue;
      m.set(p.parent, [...(m.get(p.parent) ?? []), p]);
    }
    return m;
  }, [pages, byId]);

  const selectedPage = selectedId ? (byId.get(selectedId) ?? null) : null;

  // ---- branch expand/collapse ----
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const raw = readStorage(EXPANDED_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      // corrupted → fall through to defaults
    }
    return new Set();
  });
  const [expandedInitialized, setExpandedInitialized] = useState(() =>
    Boolean(readStorage(EXPANDED_KEY)),
  );

  useEffect(() => {
    if (expandedInitialized || pages.length === 0) return;
    const initial = new Set<string>();
    for (const p of pages) {
      if (childrenOf.has(p.id) && depthOf(p, byId) < DEFAULT_VISIBLE_LAYERS - 1) initial.add(p.id);
    }
    setExpanded(initial);
    setExpandedInitialized(true);
  }, [expandedInitialized, pages, childrenOf, byId]);

  const persistExpanded = useCallback((next: Set<string>) => {
    writeStorage(EXPANDED_KEY, JSON.stringify([...next]));
  }, []);

  const toggleBranch = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistExpanded(next);
        return next;
      });
    },
    [persistExpanded],
  );

  // reveal a hidden selected node by expanding its ancestor chain (search jumps)
  useEffect(() => {
    if (!selectedPage) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      let cur = selectedPage;
      const seen = new Set<string>();
      while (cur.parent && byId.has(cur.parent) && !seen.has(cur.id)) {
        seen.add(cur.id);
        if (!next.has(cur.parent)) {
          next.add(cur.parent);
          changed = true;
        }
        cur = byId.get(cur.parent)!;
      }
      if (changed) persistExpanded(next);
      return changed ? next : prev;
    });
  }, [selectedPage, byId, persistExpanded]);

  // ---- visible subtree ----
  const visiblePages = useMemo(() => {
    const roots = pages.filter((p) => !p.parent || !byId.has(p.parent));
    const out: NavNode[] = [];
    const walk = (p: NavNode) => {
      out.push(p);
      if (!expanded.has(p.id)) return;
      for (const c of childrenOf.get(p.id) ?? []) walk(c);
    };
    for (const r of roots) walk(r);
    return out;
  }, [pages, byId, childrenOf, expanded]);

  const descendantCount = useCallback(
    (id: string): number => {
      let n = 0;
      const walk = (pid: string) => {
        for (const c of childrenOf.get(pid) ?? []) {
          n++;
          walk(c.id);
        }
      };
      walk(id);
      return n;
    },
    [childrenOf],
  );

  // ---- parent chain of the selection ----
  const pathIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedPage) return set;
    let cur: NavNode | undefined = selectedPage;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      set.add(cur.id);
      cur = cur.parent ? byId.get(cur.parent) : undefined;
    }
    return set;
  }, [selectedPage, byId]);

  return {
    dataVersion,
    editsVersion,
    pages,
    byId,
    childrenOf,
    selectedPage,
    expanded,
    toggleBranch,
    visiblePages,
    descendantCount,
    pathIds,
  };
}
