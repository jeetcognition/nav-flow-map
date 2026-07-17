import type { Surface, User } from "../../types";

export const SURFACES: Surface[] = [
  { id: "enterprise", label: "Enterprise", kind: "webapp", status: "active" },
  { id: "retail", label: "Retail", kind: "webapp", status: "coming-soon", dimensions: ["browser", "device", "viewport"] },
  { id: "windsurf", label: "Windsurf", kind: "desktop", status: "coming-soon" },
  { id: "devin-cli", label: "Devin CLI", kind: "cli", status: "coming-soon" },
];

export const USERS: User[] = [
  { id: "u-jeet", name: "Jeet Bangoria", role: "Admin", color: "#22C55E", initials: "JB" },
  { id: "u-maya", name: "Maya Chen", role: "QA", color: "#38BDF8", initials: "MC" },
  { id: "u-arjun", name: "Arjun Rao", role: "QA", color: "#A78BFA", initials: "AR" },
  { id: "u-priya", name: "Priya Nair", role: "Viewer", color: "#F59E0B", initials: "PN" },
];
