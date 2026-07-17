/** Track + fill + optional trailing % label. Color defaults by threshold. */
export function ProgressBar({
  value,
  color,
  showLabel = false,
  thresholds = [60, 30],
}: {
  value: number; // 0..100
  color?: string;
  showLabel?: boolean;
  /** [greenAtOrAbove, amberAtOrAbove] — below second is red */
  thresholds?: [number, number];
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const auto =
    clamped >= thresholds[0] ? "var(--accent)" : clamped >= thresholds[1] ? "var(--warning)" : "var(--danger)";
  return (
    <div className="progress-row">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clamped}%`, background: color ?? auto }} />
      </div>
      {showLabel && <span className="num progress-label">{Math.round(clamped)}%</span>}
    </div>
  );
}
