interface Props {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ value, size = 40, stroke = 4, color = "var(--accent)", label }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `${Math.round(clamped)}% complete`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--text-2)"
        fontSize={size * 0.28}
        fontFamily="var(--font-mono)"
      >
        {Math.round(clamped)}
      </text>
    </svg>
  );
}
