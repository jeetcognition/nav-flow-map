import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Flask, CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";
import { NAV_ITEMS } from "../../lib/nav";
import { readStorage, writeStorage } from "../../lib/storage";

const COLLAPSE_KEY = "qa-sidebar-collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => readStorage(COLLAPSE_KEY) === "1");

  useEffect(() => {
    writeStorage(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <nav className={`sidebar${collapsed ? " collapsed" : ""}`} aria-label="Primary">
      <div className="sidebar-brand">
        <span className="sidebar-logo" aria-hidden>
          <Flask size={20} weight="duotone" />
        </span>
        <span className="sidebar-title">QA Command</span>
        <button
          className="icon-btn sidebar-collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <CaretDoubleRight size={14} /> : <CaretDoubleLeft size={14} />}
        </button>
      </div>
      <div className="sidebar-items">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={18} weight="duotone" />
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** mobile bottom navigation — top 5 destinations only */
export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      {NAV_ITEMS.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `mobile-nav-link${isActive ? " active" : ""}`}
        >
          <Icon size={20} weight="duotone" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
