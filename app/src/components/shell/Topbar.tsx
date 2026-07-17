import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  CaretDown,
  MagnifyingGlass,
  Check,
  Monitor,
  Desktop,
  SignOut,
  Terminal,
} from "@phosphor-icons/react";
import { useApp } from "../../hooks/useApp";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getSurfaces, getUsers } from "../../data/dataService";
import { clearAuth } from "../../lib/auth";
import { SuggestionBox } from "./SuggestionBox";

const KIND_ICON = { webapp: Monitor, desktop: Desktop, cli: Terminal };

/* selected-item check mark in dropdown menus (shell.css owns the menu styles) */
const CHECK_STYLE: CSSProperties = { marginLeft: "auto", color: "var(--accent)" };

function SurfaceSwitcher() {
  const { surface, setSurfaceId } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div className="dropdown" ref={ref}>
      <button
        className="btn surface-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="surface-dot" aria-hidden />
        {surface.label}
        <CaretDown size={13} className={`caret${open ? " flip" : ""}`} />
      </button>
      {open && (
        <div className="dropdown-menu" role="listbox">
          {getSurfaces().map((s) => {
            const Icon = KIND_ICON[s.kind];
            const disabled = s.status === "coming-soon";
            return (
              <button
                key={s.id}
                role="option"
                aria-selected={s.id === surface.id}
                className="dropdown-item"
                disabled={disabled}
                onClick={() => {
                  setSurfaceId(s.id);
                  setOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{s.label}</span>
                {disabled && <span className="badge badge-gray">soon</span>}
                {s.id === surface.id && <Check size={14} style={CHECK_STYLE} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, setUserId } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const navigate = useNavigate();
  return (
    <div className="dropdown user-menu" ref={ref}>
      <button
        className="avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current user: ${user.name}. Switch user`}
      >
        <span className="avatar" style={{ background: user.color }}>
          {user.initials}
        </span>
      </button>
      {open && (
        <div className="dropdown-menu right" role="listbox">
          <div className="dropdown-label">Switch user (mock)</div>
          {getUsers().map((u) => (
            <button
              key={u.id}
              role="option"
              aria-selected={u.id === user.id}
              className="dropdown-item"
              onClick={() => {
                setUserId(u.id);
                setOpen(false);
              }}
            >
              <span className="avatar sm" style={{ background: u.color }}>
                {u.initials}
              </span>
              <span>
                {u.name}
                <span className="dropdown-sub">{u.role}</span>
              </span>
              {u.id === user.id && <Check size={14} style={CHECK_STYLE} />}
            </button>
          ))}
          <button
            className="dropdown-item"
            onClick={() => {
              clearAuth();
              navigate("/login", { replace: true });
            }}
          >
            <SignOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const { setSearchOpen } = useApp();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <header className="topbar">
      <SurfaceSwitcher />
      <button
        className="search-trigger"
        onClick={() => setSearchOpen(true)}
        aria-label="Open global search"
      >
        <MagnifyingGlass size={15} />
        <span>Search testcases, bugs, incidents…</span>
        <kbd className="mono">⌘K</kbd>
      </button>
      <SuggestionBox />
      <UserMenu />
    </header>
  );
}
