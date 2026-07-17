import { Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider } from "./state/AppContext";
import { Sidebar, MobileNav } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { GlobalSearch } from "./components/shell/GlobalSearch";
import { ThemeToggle } from "./components/shell/ThemeToggle";
import "./styles/shell.css";
import Dashboard from "./pages/Dashboard";
import FlowMap from "./pages/FlowMap";
import Runs from "./pages/Runs";
import RunDetail from "./pages/RunDetail";
import Bugs from "./pages/Bugs";
import BugDetail from "./pages/BugDetail";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import Automation from "./pages/Automation";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { isAuthed } from "./lib/auth";

/** old bookmarks/deep links: /map?node=… → /navflow?node=… */
function LegacyMapRedirect() {
  const [params] = useSearchParams();
  const qs = params.toString();
  return <Navigate to={`/navflow${qs ? `?${qs}` : ""}`} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ minHeight: "100%" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/navflow" element={<FlowMap />} />
          <Route path="/map" element={<LegacyMapRedirect />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/runs/:runId" element={<RunDetail />} />
          <Route path="/bugs" element={<Bugs />} />
          <Route path="/bugs/:bugId" element={<BugDetail />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:incidentId" element={<IncidentDetail />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function Shell() {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return (
    <div className="app-frame">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-scroll">
          <AnimatedRoutes />
        </main>
      </div>
      <MobileNav />
      <GlobalSearch />
      <ThemeToggle />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Shell />} />
      </Routes>
    </AppProvider>
  );
}
