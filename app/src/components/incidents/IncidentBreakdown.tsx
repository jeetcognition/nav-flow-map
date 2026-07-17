// Collapsible breakdown/trend charts for the Incidents page.
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getNode } from "../../data/dataService";
import { SEVERITIES, SEVERITY_COLOR } from "../../lib/severity";
import { CategoryDonut, TrendAreaChart } from "../ui/charts";
import { AXIS_TICK, CHART_TOOLTIP } from "../../lib/chartTheme";
import { WidgetCard } from "../ui/WidgetCard";
import { Disclosure } from "../ui/Disclosure";
import { EmptyState } from "../ui/EmptyState";
import type { Incident } from "../../types";

export function IncidentBreakdown({ incidents }: { incidents: Incident[] }) {
  const bySeverity = SEVERITIES.map((s) => ({
    sev: s,
    count: incidents.filter((i) => i.severity === s).length,
  }));

  const nodeCounts = new Map<string, number>();
  for (const i of incidents) nodeCounts.set(i.nodeId, (nodeCounts.get(i.nodeId) ?? 0) + 1);
  const topNodes = [...nodeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxNodeCount = topNodes[0]?.[1] ?? 1;

  return (
    <div className="inc-breakdown">
      <Disclosure label="Breakdown & trends">
        <div className="inc-widgets">
          <WidgetCard title="By category" index={0} className="inc-widget">
            <CategoryDonut incidents={incidents} />
          </WidgetCard>

          <WidgetCard title="By severity" index={1} className="inc-widget">
            <div style={{ height: 172 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySeverity} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid stroke="var(--grid-line)" vertical={false} />
                  <XAxis dataKey="sev" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={{ color: "var(--text)" }}
                    cursor={{ fill: "rgba(148,163,184,0.06)" }}
                  />
                  <Bar dataKey="count" name="incidents" radius={[4, 4, 0, 0]} maxBarSize={34}>
                    {bySeverity.map((d) => (
                      <Cell key={d.sev} fill={SEVERITY_COLOR[d.sev]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetCard>

          <WidgetCard title="Trend" index={2} className="inc-widget">
            <TrendAreaChart incidents={incidents} />
          </WidgetCard>

          <WidgetCard title="Top affected nodes" index={3} className="inc-widget">
            {topNodes.length === 0 ? (
              <EmptyState title="No incidents" />
            ) : (
              <div className="top-nodes">
                {topNodes.map(([nodeId, count]) => (
                  <Link key={nodeId} className="top-node-row" to={`/navflow?node=${nodeId}`}>
                    <span className="top-node-label">{getNode(nodeId)?.label ?? nodeId}</span>
                    <span className="top-node-bar">
                      <span style={{ width: `${(count / maxNodeCount) * 100}%` }} />
                    </span>
                    <span className="top-node-count num">{count}</span>
                  </Link>
                ))}
              </div>
            )}
          </WidgetCard>
        </div>
      </Disclosure>
    </div>
  );
}
