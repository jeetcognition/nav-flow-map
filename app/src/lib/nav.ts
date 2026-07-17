import { SquaresFour, Graph, Play, Bug, Fire, Robot, Gear, type Icon } from "@phosphor-icons/react";

export interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: SquaresFour, end: true },
  { to: "/map", label: "Graph Map", icon: Graph },
  { to: "/runs", label: "Runs", icon: Play },
  { to: "/bugs", label: "Issues", icon: Bug },
  { to: "/incidents", label: "Incidents", icon: Fire },
  { to: "/automation", label: "Automation", icon: Robot },
  { to: "/settings", label: "Settings", icon: Gear },
];
