import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
import { useApp } from "../hooks/useApp";
import { getSurfaces, getUsers } from "../data/dataService";
import { AI_MOCK } from "../data/aiService";
import { fadeUp } from "../lib/motion";
import "../styles/settings.css";

export default function Settings() {
  const { user } = useApp();
  return (
    <div className="page">
      <motion.div className="page-head" {...fadeUp()}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Phase 1 — UI only. Everything below is mock configuration.</p>
        </div>
      </motion.div>

      <motion.div className="settings-grid" {...fadeUp(0.08)}>
        <section className="card">
          <h3 className="settings-card-title">AI layer</h3>
          <div className="settings-inline">
            <span className="badge badge-purple">
              <Sparkle size={12} /> AI_MOCK = {String(AI_MOCK)}
            </span>
            <span className="settings-note">
              All AI features return canned responses. Swap the aiService internals for the
              Anthropic API in Phase 2.
            </span>
          </div>
        </section>

        <section className="card">
          <h3 className="settings-card-title">Surfaces</h3>
          <div className="settings-list">
            {getSurfaces().map((s) => (
              <div key={s.id} className="settings-row">
                <span className="settings-row-label">{s.label}</span>
                <span className="badge badge-outline">{s.kind}</span>
                <span className={`badge ${s.status === "active" ? "badge-green" : "badge-gray"}`}>
                  {s.status}
                </span>
                {s.dimensions && (
                  <span className="settings-dim">matrix: {s.dimensions.join(" · ")}</span>
                )}
              </div>
            ))}
          </div>
          <p className="settings-footnote">
            Surface config is data-driven — adding a surface is a config entry, not new code.
          </p>
        </section>

        <section className="card">
          <h3 className="settings-card-title">Team (mock users)</h3>
          <div className="settings-list">
            {getUsers().map((u) => (
              <div key={u.id} className="settings-row">
                <span className="avatar sm" style={{ background: u.color }}>
                  {u.initials}
                </span>
                <span className="settings-row-name">{u.name}</span>
                <span className="badge badge-outline">{u.role}</span>
                {u.id === user.id && <span className="badge badge-green">you</span>}
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
