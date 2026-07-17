import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider } from "./state/AppContext";
import { Sidebar, MobileNav } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { GlobalSearch } from "./components/shell/GlobalSearch";
import { ThemeToggle } from "./components/shell/ThemeToggle";
import "./styles/shell.css";
import Dashboard from "./pages/Dashboard";
import GraphMap from "./pages/GraphMap";
import Runs from "./pages/Runs";
import RunDetail from "./pages/RunDetail";
import Bugs from "./pages/Bugs";
import BugDetail from "./pages/BugDetail";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import Automation from "./pages/Automation";
import Settings from "./pages/Settings";

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
          <Route path="/map" element={<GraphMap />} />
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

export default function App() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}
