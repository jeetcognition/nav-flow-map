import "../../styles/incidents.css";

/** Small AI-confidence bar with a percent readout. */
export function ConfidenceMeter({ value }: { value: number }) {
  const color = value > 0.8 ? "var(--accent)" : value >= 0.6 ? "var(--warning)" : "var(--danger)";
  return (
    <span className="conf-meter" title={`AI confidence ${Math.round(value * 100)}%`}>
      <span className="conf-track">
        <span className="conf-fill" style={{ width: `${value * 100}%`, background: color }} />
      </span>
      <span className="conf-pct num">{Math.round(value * 100)}%</span>
    </span>
  );
}
