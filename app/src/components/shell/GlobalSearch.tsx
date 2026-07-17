import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Bug, Fire, Graph, Flask } from "@phosphor-icons/react";
import { useApp } from "../../hooks/useApp";
import { getBugs, getIncidents, getNodes, getTestCases } from "../../data/dataService";

interface Hit {
  kind: "node" | "testcase" | "bug" | "incident";
  id: string;
  title: string;
  sub: string;
  to: string;
}

const KIND_ICON = { node: Graph, testcase: Flask, bug: Bug, incident: Fire };
const KIND_LABEL = { node: "Node", testcase: "Testcase", bug: "Bug", incident: "Incident" };

function search(q: string): Hit[] {
  const needle = q.toLowerCase();
  const match = (s: string) => s.toLowerCase().includes(needle);
  const hits: Hit[] = [];
  for (const n of getNodes()) {
    if (match(n.label) || match(n.id)) hits.push({ kind: "node", id: n.id, title: n.label, sub: n.route, to: `/map?node=${n.id}` });
  }
  for (const c of getTestCases()) {
    if (match(c.id) || match(c.title)) hits.push({ kind: "testcase", id: c.id, title: c.id, sub: c.title, to: `/automation?case=${c.id}` });
  }
  for (const b of getBugs()) {
    if (match(b.id) || match(b.title)) hits.push({ kind: "bug", id: b.id, title: b.id, sub: b.title, to: `/bugs/${b.id}` });
  }
  for (const i of getIncidents()) {
    if (match(i.id) || match(i.title)) hits.push({ kind: "incident", id: i.id, title: i.id, sub: i.title, to: `/incidents/${i.id}` });
  }
  return hits.slice(0, 12);
}

export function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const hits = useMemo(() => (q.trim().length > 1 ? search(q.trim()) : []), [q]);

  useEffect(() => {
    if (searchOpen) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [searchOpen]);

  const go = (hit: Hit) => {
    setSearchOpen(false);
    navigate(hit.to);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="modal-backdrop search-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            className="search-palette"
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Global search"
          >
            <div className="search-input-row">
              <MagnifyingGlass size={17} color="var(--text-3)" />
              <input
                ref={inputRef}
                value={q}
                placeholder="Search testcases, bugs, incidents, nodes…"
                aria-label="Search"
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter" && hits[sel]) go(hits[sel]);
                }}
              />
            </div>
            {q.trim().length > 1 && (
              <div className="search-results" role="listbox">
                {hits.length === 0 && <div className="search-empty">No matches for “{q}”</div>}
                {hits.map((h, i) => {
                  const Icon = KIND_ICON[h.kind];
                  return (
                    <button
                      key={`${h.kind}-${h.id}`}
                      role="option"
                      aria-selected={i === sel}
                      className={`search-hit${i === sel ? " selected" : ""}`}
                      onMouseEnter={() => setSel(i)}
                      onClick={() => go(h)}
                    >
                      <Icon size={16} color="var(--text-3)" />
                      <span className="search-hit-title">{h.title}</span>
                      <span className="search-hit-sub">{h.sub}</span>
                      <span className="badge badge-outline">{KIND_LABEL[h.kind]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
