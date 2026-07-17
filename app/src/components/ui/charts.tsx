// Canonical chart kit — every recharts usage goes through here so tooltips,
// axes, and bucketing math stay identical across pages.
import { useId } from "react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { bucketByWeek } from "../../lib/dates";
import { CATEGORIES, CATEGORY_META } from "../../lib/categoryMeta";
import { CHART_TOOLTIP, AXIS_TICK } from "../../lib/chartTheme";
import { incidentCategory } from "../../data/dataService";
import type { Incident } from "../../types";

export function ChartTooltip() {
  return <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={{ color: "var(--text)" }} />;
}

/** Incidents-by-category donut with center total and side legend. */
export function CategoryDonut({ incidents, height = 172 }: { incidents: Incident[]; height?: number }) {
  const data = CATEGORIES.map((cat) => ({
    name: CATEGORY_META[cat].label,
    color: CATEGORY_META[cat].color,
    value: incidents.filter((i) => incidentCategory(i) === cat).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="chart-donut-row" style={{ height }}>
      <div className="chart-donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <ChartTooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-donut-center num" aria-hidden>
          {incidents.length}
        </div>
      </div>
      <ul className="chart-donut-legend">
        {data.map((d) => (
          <li key={d.name}>
            <span className="chart-legend-dot" style={{ background: d.color }} />
            {d.name}
            <span className="num chart-legend-count">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Weekly trend area chart — one bucketing algorithm for the whole app. */
export function TrendAreaChart({
  incidents,
  color = "var(--info)",
  height = 172,
  weeks = 5,
}: {
  incidents: Incident[];
  color?: string;
  height?: number;
  weeks?: number;
}) {
  const gradientId = useId();
  const data = bucketByWeek(incidents, weeks);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid-line)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <ChartTooltip />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
